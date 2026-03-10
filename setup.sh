#!/bin/bash

# ============================================================================
# OdontoGroup - Setup Automático
# Configura Supabase, Env e Edge Functions
# ============================================================================

set -e

echo "🚀 Iniciando setup do OdontoGroup..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================================================
# 1. Criar .env.local no frontend
# ============================================================================

echo -e "${YELLOW}[1/4] Criando .env.local...${NC}"

cat > /Users/carloseduardosilvaxavier/Documents/projects/odonto-group-crud/frontend/.env.local << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://mgyvbncjvegmdnimrzza.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1neXZibmNqdmVnbWRuaW1yenphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjI1MjMsImV4cCI6MjA4NjQ5ODUyM30.jfbKfvK0xYZ8uL3sYw3jK5pQzV8mN9aB2cD4eF6gH7i

# DocuSeal (configurado via Supabase secrets)
VITE_DOCUSEAL_API_KEY=cLLfGLcNdCyieJgVPZsMHNvagHKTXJPEb67rbutyCbK
EOF

echo -e "${GREEN}✓ .env.local criado${NC}"

# ============================================================================
# 2. Configurar Supabase Secrets
# ============================================================================

echo ""
echo -e "${YELLOW}[2/4] Configurando Supabase secrets...${NC}"

cat > /tmp/supabase-setup.txt << 'EOF'
DOCUSEAL_API_KEY=cLLfGLcNdCyieJgVPZsMHNvagHKTXJPEb67rbutyCbK
DOCUSEAL_TEMPLATE_ID=default
SUPABASE_URL=https://mgyvbncjvegmdnimrzza.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1neXZibmNqdmVnbWRuaW1yenphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkyMjUyMywiZXhwIjoyMDg2NDk4NTIzfQ._0qe75AfkyCOkrHZLBtN7ZMpNtpg6TdEqQS2w-rYRjY
EOF

echo -e "${GREEN}✓ Secrets preparados (configure no Supabase Console)${NC}"

# ============================================================================
# 3. Frontend Setup
# ============================================================================

echo ""
echo -e "${YELLOW}[3/4] Instalando dependências do frontend...${NC}"

cd /Users/carloseduardosilvaxavier/Documents/projects/odonto-group-crud/frontend

if [ ! -d "node_modules" ]; then
  npm install > /dev/null 2>&1
  echo -e "${GREEN}✓ npm install completo${NC}"
else
  echo -e "${GREEN}✓ node_modules já existe${NC}"
fi

# ============================================================================
# 4. Instruções Finais
# ============================================================================

echo ""
echo -e "${YELLOW}[4/4] Configuração manual necessária...${NC}"
echo ""
echo -e "${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
echo ""
echo "1️⃣  Acessar Supabase Console:"
echo "   ${GREEN}https://app.supabase.com/project/mgyvbncjvegmdnimrzza${NC}"
echo ""
echo "2️⃣  Ir para: Settings → Functions → Secrets"
echo "   Adicionar as variáveis de /tmp/supabase-setup.txt"
echo ""
echo "3️⃣  No SQL Editor, executar:"
echo "   ${GREEN}database/migrations/001_initial_schema.sql${NC}"
echo ""
echo "4️⃣  Habilitar Realtime:"
echo "   Settings → Realtime → ON"
echo ""
echo "5️⃣  Criar primeiro admin (SQL):"
echo ""
cat << 'ADMIN_SQL'
-- No Supabase Console → Auth → Add User
-- Email: 12345678901@sistema.local
-- Password: teste123
-- Depois execute:

INSERT INTO public.profiles (id, cpf, nome, role)
VALUES ('seu-uuid-aqui', '12345678901', 'Admin OdontoGroup', 'admin');
ADMIN_SQL
echo ""
echo "6️⃣  Rodar frontend:"
echo "   ${GREEN}cd frontend && npm run dev${NC}"
echo ""
echo -e "${GREEN}🎉 Pronto! App rodará em http://localhost:5173${NC}"
echo ""

# ============================================================================
# Salvar credenciais em arquivo seguro
# ============================================================================

mkdir -p ~/.odonto-group

cat > ~/.odonto-group/credentials.txt << 'CREDS'
OdontoGroup - Credenciais
========================

Supabase Project: mgyvbncjvegmdnimrzza
URL: https://mgyvbncjvegmdnimrzza.supabase.co
Region: sa-east-1

Database:
- Host: aws-1-sa-east-1.pooler.supabase.com
- Port: 5432
- User: postgres
- Password: AK0vhrT8EKOvJNxs
- Database: postgres

API Keys:
- ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1neXZibmNqdmVnbWRuaW1yenphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjI1MjMsImV4cCI6MjA4NjQ5ODUyM30.jfbKfvK0xYZ8uL3sYw3jK5pQzV8mN9aB2cD4eF6gH7i
- SERVICE_ROLE: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1neXZibmNqdmVnbWRuaW1yenphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkyMjUyMywiZXhwIjoyMDg2NDk4NTIzfQ._0qe75AfkyCOkrHZLBtN7ZMpNtpg6TdEqQS2w-rYRjY

DocuSeal:
- API_KEY: cLLfGLcNdCyieJgVPZsMHNvagHKTXJPEb67rbutyCbK
- Modo: Sandbox/Test
- Template: default

⚠️  IMPORTANTE:
1. Não commitar este arquivo no Git
2. Não compartilhar as chaves
3. Revogue as chaves após fim do projeto
4. Use .env.local para desenvolvimento
CREDS

echo -e "${YELLOW}📝 Credenciais salvas em: ~/.odonto-group/credentials.txt${NC}"
echo ""

