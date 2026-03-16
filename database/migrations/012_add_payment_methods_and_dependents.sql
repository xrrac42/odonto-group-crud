-- ============================================================================
-- OdontoGroup - Migração 012
-- Novos campos para formas de pagamento e dependentes
-- ============================================================================

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS unidade_consumo VARCHAR(100),
  ADD COLUMN IF NOT EXISTS energia_companhia VARCHAR(150),
  ADD COLUMN IF NOT EXISTS pagamento_banco VARCHAR(120),
  ADD COLUMN IF NOT EXISTS pagamento_agencia VARCHAR(40),
  ADD COLUMN IF NOT EXISTS pagamento_conta VARCHAR(60),
  ADD COLUMN IF NOT EXISTS pagamento_orgao VARCHAR(255),
  ADD COLUMN IF NOT EXISTS pagamento_matricula VARCHAR(100),
  ADD COLUMN IF NOT EXISTS has_dependents BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dependents TEXT;

COMMENT ON COLUMN public.sales.unidade_consumo IS 'Unidade de consumo para pagamento por conta de energia';
COMMENT ON COLUMN public.sales.energia_companhia IS 'Companhia selecionada para pagamento por conta de energia';
COMMENT ON COLUMN public.sales.pagamento_banco IS 'Banco para PIX automático';
COMMENT ON COLUMN public.sales.pagamento_agencia IS 'Agência para PIX automático ou débito em conta';
COMMENT ON COLUMN public.sales.pagamento_conta IS 'Conta para PIX automático ou débito em conta';
COMMENT ON COLUMN public.sales.pagamento_orgao IS 'Órgão para pagamento por desconto em folha';
COMMENT ON COLUMN public.sales.pagamento_matricula IS 'Matrícula para pagamento por desconto em folha';
COMMENT ON COLUMN public.sales.has_dependents IS 'Indica se a venda possui dependentes';
COMMENT ON COLUMN public.sales.dependents IS 'Texto livre com dependentes (nome e CPF)';
