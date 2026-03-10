# Database - OdontoGroup

Migrações SQL para o banco de dados PostgreSQL (Supabase).

## Migrations

### 001_initial_schema.sql

Cria o schema inicial com:

**ENUMs**:
- `user_role` (admin, operator)
- `sale_status` (draft, awaiting_signature, signed, approved_manually)
- `plan_type` (plano_basico, plano_standard, plano_premium)

**Tabelas**:
- `profiles` - Extensão de auth.users com CPF, nome e role
- `clients` - Dados dos clientes-prospects
- `sales` - Registro de vendas com rastreamento DocuSeal

**Recursos**:
- Índices para queries rápidas
- Triggers para updated_at automático
- RLS (Row Level Security) completo
- Comentários para documentação

## Como Executar

1. Abra Supabase Console → SQL Editor
2. Copie todo conteúdo de `001_initial_schema.sql`
3. Cole na query editor
4. Clique "Run"
5. Verifique se todas as tabelas foram criadas (seção Tables)

## Verificação de RLS

Após executar, confirme que RLS está habilitado:

```sql
-- Verificar que RLS está ativo
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND row_security_enabled = true;
```

## Backup

Para fazer backup da estrutura:

```bash
pg_dump --schema-only seu-db > backup.sql
```

## Rollback

Se precisar voltar, delete as tabelas:

```sql
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS sale_status;
DROP TYPE IF EXISTS plan_type;
DROP TYPE IF EXISTS user_role;
```
