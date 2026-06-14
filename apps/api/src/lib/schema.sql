-- ============================================================
-- Estudar-se-ia — Schema do Banco de Dados
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Habilitar extensão para UUID
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- USERS (espelha auth.users do Supabase com dados extras)
-- ────────────────────────────────────────────────────────────
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  full_name     text,
  university    text,                        -- ex: "USP", "UNICAMP"
  course        text,                        -- ex: "Engenharia de Software"
  semester      integer,                     -- semestre atual
  plan          text not null default 'free' check (plan in ('free', 'pro')),
  plans_count   integer not null default 0,  -- contador para limite do free tier
  stripe_customer_id text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- RLS: usuário só vê/edita seu próprio perfil
alter table public.users enable row level security;
create policy "users: próprio perfil" on public.users
  for all using (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- SUBJECTS (ementas parseadas)
-- ────────────────────────────────────────────────────────────
create table public.subjects (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade,
  name                text not null,              -- ex: "Cálculo II"
  code                text,                       -- ex: "MAT0122"
  course              text,                       -- ex: "Engenharia Civil"
  university          text,
  credits             integer,
  workload_hours      integer,                    -- carga horária total
  description         text,                       -- ementa descritiva original
  topics              jsonb not null default '[]', -- array de tópicos extraídos
  bibliography        jsonb not null default '[]', -- array de referências
  prerequisites       jsonb not null default '[]', -- array de pré-requisitos
  raw_text            text,                       -- texto bruto do PDF (para reparse)
  source_type         text not null default 'pdf' check (source_type in ('pdf', 'text', 'manual')),
  created_at          timestamptz not null default now()
);

-- Index para buscas frequentes
create index subjects_user_id_idx on public.subjects(user_id);

alter table public.subjects enable row level security;
create policy "subjects: próprio usuário" on public.subjects
  for all using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- PLANS (planos de estudo gerados)
-- ────────────────────────────────────────────────────────────
create table public.plans (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.users(id) on delete cascade,
  subject_id        uuid not null references public.subjects(id) on delete cascade,
  title             text not null,
  status            text not null default 'active' check (status in ('active', 'completed', 'archived')),
  hours_per_day     numeric(3,1) not null,         -- horas disponíveis por dia
  days_per_week     integer not null,              -- dias por semana disponíveis
  exam_date         date,                          -- data da prova/entrega
  total_weeks       integer not null,              -- duração total do plano
  schedule          jsonb not null default '[]',  -- plano semanal gerado (ver tipo abaixo)
  progress          integer not null default 0,   -- % de conclusão (0-100)
  application_context text,                       -- contexto do aluno (por que está estudando)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

/*
  Estrutura do campo `schedule` (jsonb):
  [
    {
      "week": 1,
      "days": [
        {
          "day": 1,
          "topic": "Limites e continuidade",
          "duration_minutes": 60,
          "type": "teoria" | "exercicio" | "revisao",
          "priority": "alta" | "media" | "baixa",
          "completed": false
        }
      ]
    }
  ]
*/

create index plans_user_id_idx on public.plans(user_id);
create index plans_subject_id_idx on public.plans(subject_id);

alter table public.plans enable row level security;
create policy "plans: próprio usuário" on public.plans
  for all using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- EXERCISES (exercícios gerados por tópico)
-- ────────────────────────────────────────────────────────────
create table public.exercises (
  id            uuid primary key default uuid_generate_v4(),
  plan_id       uuid not null references public.plans(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete cascade,
  topic         text not null,
  question        text not null,
  options         jsonb not null,   -- array de {key: "a"|"b"|"c"|"d", text: string}
  answer          text not null,    -- "a" | "b" | "c" | "d"
  explanation     text not null,
  scaffolded_hint text,             -- dica de raciocínio sem revelar resposta
  type            text not null default 'conceitual'
                  check (type in ('conceitual', 'aplicacao', 'analise', 'metacognitiva')),
  user_answer   text,             -- resposta dada pelo usuário
  answered_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index exercises_plan_id_idx on public.exercises(plan_id);
create index exercises_user_id_idx on public.exercises(user_id);

alter table public.exercises enable row level security;
create policy "exercises: próprio usuário" on public.exercises
  for all using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- STUDY SESSIONS (tracking de progresso — usado para moat)
-- ────────────────────────────────────────────────────────────
create table public.study_sessions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  plan_id         uuid not null references public.plans(id) on delete cascade,
  topic           text not null,
  week            integer not null,
  day             integer not null,
  duration_actual integer,         -- minutos reais estudados
  completed       boolean not null default false,
  notes           text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index sessions_user_id_idx on public.study_sessions(user_id);
create index sessions_plan_id_idx on public.study_sessions(plan_id);

alter table public.study_sessions enable row level security;
create policy "sessions: próprio usuário" on public.study_sessions
  for all using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- FUNÇÃO: atualiza updated_at automaticamente
-- ────────────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at  before update on public.users  for each row execute function update_updated_at();
create trigger plans_updated_at  before update on public.plans  for each row execute function update_updated_at();

-- ────────────────────────────────────────────────────────────
-- FUNÇÃO: cria perfil automaticamente ao registrar
-- ────────────────────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
