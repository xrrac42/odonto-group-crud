-- ============================================================================
-- OdontoGroup - Criar Operador de Teste
-- ============================================================================
-- Operador: João Teste da Silva
-- CPF: 11122233344
-- Senha: teste123
-- ============================================================================

-- PASSO 1: Criar o usuário no Supabase Auth Console
-- 1. Vá para: https://app.supabase.com/project/mgyvbncjvegmdnimrzza/auth/users
-- 2. Clique "Add user" ou "Invite user"
-- 3. Preencha:
--    Email: 11122233344@sistema.local
--    Password: teste123
-- 4. COPIE o UUID gerado
-- 5. Substitua 'UUID_DO_OPERADOR' abaixo pelo UUID copiado

-- PASSO 2: Execute este SQL no SQL Editor:

INSERT INTO public.profiles (id, cpf, nome, role)
VALUES (
  'UUID_DO_OPERADOR',  -- <- COLE O UUID AQUI
  '11122233344',
  'João Teste da Silva',
  'operator'
);

-- ✅ Após executar, o operador poderá fazer login com:
-- CPF: 11122233344
-- Senha: teste123
-- Role: operator

-- ============================================================================
-- CRIAR MAIS OPERADORES (OPCIONAL)
-- ============================================================================

-- Operador 2: Maria Teste Santos
-- CPF: 22233344455
-- Senha: teste123

-- INSERT INTO public.profiles (id, cpf, nome, role)
-- VALUES (
--   'UUID_DO_OPERADOR_2',
--   '22233344455',
--   'Maria Teste Santos',
--   'operator'
-- );

-- Operador 3: Pedro Teste Oliveira
-- CPF: 33344455566
-- Senha: teste123

-- INSERT INTO public.profiles (id, cpf, nome, role)
-- VALUES (
--   'UUID_DO_OPERADOR_3',
--   '33344455566',
--   'Pedro Teste Oliveira',
--   'operator'
-- );
