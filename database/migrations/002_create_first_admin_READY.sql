-- ============================================================================
-- OdontoGroup - Criar Primeiro Admin (PRONTO PARA EXECUTAR)
-- ============================================================================

-- PASSO 1: Crie o usuário no Supabase Auth Console:
-- 1. Vá para: https://app.supabase.com/project/mgyvbncjvegmdnimrzza/auth/users
-- 2. Clique "Add user" ou "Invite user"
-- 3. Email: admin@odonto.local
-- 4. Password: teste123
-- 5. COPIE o UUID gerado

-- PASSO 2: Substitua o UUID abaixo pelo UUID do usuário criado acima:

INSERT INTO public.profiles (id, cpf, nome, role)
VALUES (
  'SUBSTITUIR_COM_UUID_REAL',  -- <- COLE O UUID AQUI
  '12345678901',
  'Admin OdontoGroup',
  'admin'
);

-- ✅ Após executar, você poderá fazer login com:
-- Email: admin@odonto.local
-- Senha: teste123
-- Role: admin
