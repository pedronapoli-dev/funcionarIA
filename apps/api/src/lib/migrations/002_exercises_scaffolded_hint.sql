-- Migration 002: Add scaffolded_hint column and update type CHECK constraint
-- Run in Supabase SQL Editor

-- 1. Add scaffolded_hint column (nullable text)
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS scaffolded_hint text;

-- 2. Drop old CHECK constraint and create new one including 'metacognitiva'
ALTER TABLE public.exercises
  DROP CONSTRAINT IF EXISTS exercises_type_check;

ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_type_check
  CHECK (type IN ('conceitual', 'aplicacao', 'analise', 'metacognitiva'));
