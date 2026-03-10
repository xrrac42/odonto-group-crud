-- Desabilitar RLS completamente na tabela profiles para evitar recursão infinita
-- Como usamos autenticação do Supabase Auth, não precisamos de RLS adicional

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow self profile creation" ON profiles;

-- Desabilitar RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';
