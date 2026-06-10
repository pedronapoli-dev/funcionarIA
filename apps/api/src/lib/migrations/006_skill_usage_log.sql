-- Migration 006: cooldown de checkin/recalibrate
-- Run in Supabase SQL Editor
-- Aplicado em produção via Supabase MCP em 2026-06-10

-- Registra cada execução de checkin/recalibrate para impor cooldown:
--   checkin: 1x a cada 24h (por plano, ou globalmente quando plan_id é nulo — Phase 1)
--   recalibrate: 1x a cada 168h (1 semana), mesma regra de escopo
CREATE TABLE public.skill_usage_log (
  id         uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id    uuid REFERENCES public.plans(id) ON DELETE CASCADE,
  skill_type text NOT NULL CHECK (skill_type IN ('checkin', 'recalibrate')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX skill_usage_log_lookup_idx
  ON public.skill_usage_log (user_id, skill_type, plan_id, created_at DESC);

ALTER TABLE public.skill_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own skill usage"
  ON public.skill_usage_log FOR SELECT
  USING (auth.uid() = user_id);
