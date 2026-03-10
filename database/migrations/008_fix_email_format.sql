-- Corrigir formato de email de todos os usuários de @sistema.test para @sistema.local
-- Isso garante que o login funcione corretamente

-- Atualizar emails na tabela auth.users
UPDATE auth.users 
SET 
  email = REPLACE(email, '@sistema.test', '@sistema.local'),
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{email}',
    to_jsonb(REPLACE(email, '@sistema.test', '@sistema.local'))
  )
WHERE email LIKE '%@sistema.test';

-- Verificar resultado
SELECT id, email, raw_user_meta_data->>'cpf' as cpf 
FROM auth.users 
WHERE email LIKE '%@sistema.local'
ORDER BY created_at;
