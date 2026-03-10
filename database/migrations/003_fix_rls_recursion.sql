-- ============================================================================
-- FIX: Desabilitar RLS temporariamente para criar primeiro admin
-- ============================================================================

-- PASSO 1: Desabilitar RLS na tabela profiles
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Criar o primeiro admin (substitua o UUID)
INSERT INTO public.profiles (id, cpf, nome, role)
VALUES (
  'SUBSTITUIR_COM_UUID_DO_USUARIO',
  '12345678901',
  'Admin OdontoGroup',
  'admin'
);

-- PASSO 3: Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ✅ Pronto! Agora execute os dois passos seguintes:
-- 1. Crie o usuário em: https://app.supabase.com/project/mgyvbncjvegmdnimrzza/auth/users
--    Email: 12345678901@sistema.local
--    Password: teste123
-- 2. Copie o UUID e substitua em 'SUBSTITUIR_COM_UUID_DO_USUARIO' acima
-- 3. Execute este SQL no Supabase Console
