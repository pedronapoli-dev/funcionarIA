-- Migration 005: incremento atômico de api_calls_this_month para planos ilimitados
-- Run in Supabase SQL Editor
-- Aplicado em produção via Supabase MCP em 2026-06-10

-- 1. Stored procedure para incremento atômico (evita race condition)
CREATE OR REPLACE FUNCTION public.increment_api_calls(user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.users
  SET api_calls_this_month = api_calls_this_month + 1
  WHERE id = user_id;
$$;

-- 2. Restringir execução a service_role (Supabase concede EXECUTE a anon/authenticated
--    por padrão na criação da função — sem isso, qualquer usuário autenticado poderia
--    incrementar o contador de api_calls de OUTRO usuário via /rest/v1/rpc)
REVOKE EXECUTE ON FUNCTION public.increment_api_calls(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_api_calls(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_api_calls(uuid) TO service_role;
