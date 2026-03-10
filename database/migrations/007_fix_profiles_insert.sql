-- ============================================================================
-- FIX: Permitir criação do próprio perfil após signUp
-- ============================================================================
-- O signUp no frontend autentica o novo usuário, então o INSERT deve permitir
-- que o próprio usuário crie o seu profile.

-- Remover política que exige admin para INSERT
DROP POLICY IF EXISTS "Only admins can create profiles" ON public.profiles;

-- Permitir que o próprio usuário crie o seu perfil
CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- (Opcional) manter leitura do próprio perfil
-- CREATE POLICY "Users can read their own profile" ON public.profiles
--   FOR SELECT USING (auth.uid() = id);
