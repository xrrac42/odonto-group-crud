-- ============================================================================
-- OdontoGroup - Migração 011
-- Adiciona plano_beta e novos campos de cliente (RG, sexo, etc.)
-- ============================================================================

-- 1. Adicionar novos planos ao enum plan_type
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'plano_alfa';
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'plano_beta';
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'plano_delta';

-- 2. Adicionar novos campos na tabela clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS rg VARCHAR(20),
  ADD COLUMN IF NOT EXISTS orgao_expedidor VARCHAR(50),
  ADD COLUMN IF NOT EXISTS sexo VARCHAR(20),
  ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50),
  ADD COLUMN IF NOT EXISTS nome_social VARCHAR(255),
  -- Endereço separado em campos
  ADD COLUMN IF NOT EXISTS endereco_logradouro VARCHAR(255),
  ADD COLUMN IF NOT EXISTS endereco_numero VARCHAR(20),
  ADD COLUMN IF NOT EXISTS endereco_complemento VARCHAR(100),
  ADD COLUMN IF NOT EXISTS endereco_bairro VARCHAR(100),
  ADD COLUMN IF NOT EXISTS endereco_cidade VARCHAR(100),
  ADD COLUMN IF NOT EXISTS endereco_uf VARCHAR(2),
  ADD COLUMN IF NOT EXISTS endereco_cep VARCHAR(9);

-- 3. Adicionar campos de pagamento na tabela sales
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(50), -- 'pix' | 'cartao_credito'
  ADD COLUMN IF NOT EXISTS periodicidade_cobranca VARCHAR(50), -- 'mensal' | 'anual'
  ADD COLUMN IF NOT EXISTS valor_mensal DECIMAL(10,2);

-- 4. Comentários para documentação
COMMENT ON COLUMN public.clients.rg IS 'Registro Geral do cliente';
COMMENT ON COLUMN public.clients.orgao_expedidor IS 'Órgão expedidor do RG (ex: SSP-SP)';
COMMENT ON COLUMN public.clients.sexo IS 'Sexo do cliente: Masculino, Feminino, Outro';
COMMENT ON COLUMN public.clients.estado_civil IS 'Estado civil: Solteiro(a), Casado(a), Divorciado(a), Viúvo(a)';
COMMENT ON COLUMN public.clients.nome_social IS 'Nome social do cliente (opcional)';
COMMENT ON COLUMN public.sales.forma_pagamento IS 'Forma de pagamento: pix ou cartao_credito';
COMMENT ON COLUMN public.sales.periodicidade_cobranca IS 'Periodicidade de cobrança: mensal ou anual';
COMMENT ON COLUMN public.sales.valor_mensal IS 'Valor mensal do plano contratado';
