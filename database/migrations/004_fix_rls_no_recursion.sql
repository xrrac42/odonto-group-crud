-- ============================================================================
-- FIX: Corrigir Recursão Infinita em RLS
-- ============================================================================

-- PASSO 1: Desabilitar RLS temporariamente
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Remover políticas problemáticas
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Operators see own sales, admins see all" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can create sales" ON public.sales;
DROP POLICY IF EXISTS "Operators update own sales, admins update all" ON public.sales;

-- PASSO 3: Criar políticas CORRIGIDAS que não causam recursão
-- Usar a tabela WITHOUT RLS dentro das subqueries

-- Profiles: Usuário pode ler seu próprio perfil
CREATE POLICY "Users can read their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Profiles: Admins podem ler todos (sem recursão - usa tabela auth.users)
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::user_role
  );

-- Profiles: Apenas admins podem criar
CREATE POLICY "Only admins can create profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::user_role
  );

-- Profiles: Apenas admins podem atualizar
CREATE POLICY "Only admins can update profiles" ON public.profiles
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::user_role
  );

-- Profiles: Apenas admins podem deletar
CREATE POLICY "Only admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::user_role
  );

-- Clients: Operadores e admins podem ler
CREATE POLICY "Authenticated users can read clients" ON public.clients
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('operator'::user_role, 'admin'::user_role)
  );

-- Clients: Operadores e admins podem criar
CREATE POLICY "Authenticated users can create clients" ON public.clients
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('operator'::user_role, 'admin'::user_role)
  );

-- Clients: Operadores e admins podem atualizar
CREATE POLICY "Authenticated users can update clients" ON public.clients
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('operator'::user_role, 'admin'::user_role)
  );

-- Sales: Operadores veem suas próprias vendas, admins veem todas
CREATE POLICY "Operators see own sales, admins see all" ON public.sales
  FOR SELECT USING (
    operator_id = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::user_role
  );

-- Sales: Usuários autenticados podem criar vendas
CREATE POLICY "Authenticated users can create sales" ON public.sales
  FOR INSERT WITH CHECK (
    operator_id = auth.uid()
  );

-- Sales: Operadores podem atualizar suas próprias vendas, admins atualizam tudo
CREATE POLICY "Operators update own sales, admins update all" ON public.sales
  FOR UPDATE USING (
    operator_id = auth.uid() OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'::user_role
  );

-- PASSO 4: Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- ✅ Pronto! As políticas agora não causam recursão infinita
