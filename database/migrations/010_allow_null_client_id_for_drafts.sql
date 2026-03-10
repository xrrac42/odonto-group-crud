-- ============================================================================
-- OdontoGroup - Migração 010
-- Permitir client_id NULL para suportar drafts sem cliente vinculado
-- ============================================================================

-- Remover a constraint NOT NULL do client_id
ALTER TABLE public.sales 
  ALTER COLUMN client_id DROP NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.sales.client_id IS 
  'ID do cliente. Pode ser NULL quando a venda está em status draft inicial (antes de preencher os dados do cliente)';
