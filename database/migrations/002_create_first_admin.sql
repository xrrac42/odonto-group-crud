-- ============================================================================
-- OdontoGroup - Criar Primeiro Admin
-- ============================================================================
-- INSTRUÇÕES:
-- 1. Abra Supabase Console → SQL Editor
-- 2. Cole este arquivo
-- 3. Clique "Run"

-- Substitua 'UUID_DO_USUARIO' pelo ID real do usuário criado no Auth

-- Primeiro, você precisa criar um usuário via Supabase Auth Console:
-- 1. Vá para: Authentication → Users
-- 2. Clique "Add user"
-- 3. Email: 12345678901@sistema.local
-- 4. Password: teste123
-- 5. Clique "Send magic link" e copie o UUID do usuário criado

-- Depois execute este SQL com o UUID correto:

INSERT INTO public.profiles (id, cpf, nome, role)
VALUES (
  'SUBSTITUA_AQUI_COM_UUID_DO_USUARIO', -- Copiar o UUID do Auth
  '12345678901',
  'Admin OdontoGroup',
  'admin'
);

-- Após executar, você poderá fazer login com:
-- CPF: 12345678901
-- Senha: teste123
-- Role: admin

-- Para criar mais operadores depois, use:
-- INSERT INTO public.profiles (id, cpf, nome, role)
-- VALUES ('uuid-do-operador', 'cpf', 'nome', 'operator');
