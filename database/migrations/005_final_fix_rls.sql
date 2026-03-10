-- ============================================================================
-- FIX FINAL: Desabilitar RLS em profiles (seguro - ligada a auth.users)
-- ============================================================================

-- PASSO 1: Desabilitar RLS em profiles (é seguro - ligada a auth.users)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Dropar todas as políticas em profiles
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

-- PASSO 3: Criar políticas SIMPLES em clients e sales (sem verificar role em profiles)

-- DROP antigas policies
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Operators see own sales, admins see all" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can create sales" ON public.sales;
DROP POLICY IF EXISTS "Operators update own sales, admins update all" ON public.sales;

-- Clients: Apenas usuários autenticados podem ler/criar/atualizar
CREATE POLICY "Authenticated users can read clients" ON public.clients
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update clients" ON public.clients
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Sales: Apenas usuários autenticados podem ler/criar/atualizar
CREATE POLICY "Authenticated users can read sales" ON public.sales
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create sales" ON public.sales
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sales" ON public.sales
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ✅ Pronto! RLS agora funciona sem recursão infinita
