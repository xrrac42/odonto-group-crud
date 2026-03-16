# OdontoGroup - CRUD de Vendas Odontológicas

## 📋 Visão Geral

Sistema interno de vendas de planos odontológicos focado em performance e entrega rápida. Stack: React (Vite) + TailwindCSS + Supabase (Auth, Database, Edge Functions) + DocuSeal (Assinatura Digital).

**Arquitetura sem backend externo**: Toda regra de negócio reside no Supabase ou Frontend.

---

## 🎯 Requisitos Críticos

### 1. Autenticação com CPF
- ✅ Supabase Auth com email fictício (`CPF@operador.sistema`)
- ✅ Frontend converte CPF para email antes de autenticar
- ✅ Roles customizadas via tabela `profiles` (admin/operator)

### 2. Banco de Dados
- ✅ 3 tabelas principais: `profiles`, `clients`, `sales`
- ✅ Row Level Security (RLS) implementada
- ✅ Triggers para `updated_at` automático

### 3. Integração DocuSeal
- ✅ Edge Function `create-envelope` segura
- ✅ API Key isolada em variáveis de ambiente
- ✅ Retorna link de assinatura para compartilhar

### 4. Fluxo de Venda (4 passos)
- ✅ Passo 1: Validação (Operador autenticado)
- ✅ Passo 2: Dados do Cliente (Formulário completo)
- ✅ Passo 3: Aguardando Assinatura (Realtime + Polling)
- ✅ Passo 4: Confirmação Final (Status atualizado)

### 5. Painel Admin
- ✅ Visualização e filtro de vendas
- ✅ Ação manual de aprovação (signed → approved_manually)
- ✅ Gerenciamento de usuários (criar/remover operadores)

### 6. Segurança (RLS)
- ✅ Operadores veem apenas suas vendas
- ✅ Admins veem tudo
- ✅ Apenas admins criam novos perfis

---

## 📁 Estrutura do Projeto

```
odonto-group-crud/
├── database/
│   └── migrations/
│       └── 001_initial_schema.sql          # Schema completo com RLS
├── supabase/
│   └── functions/
│       └── create-envelope/
│           ├── index.ts                    # Edge Function para DocuSeal
│           └── deno.json                   # Config Deno
├── frontend/
│   └── src/
│       ├── types/
│       │   └── index.ts                    # Tipos TypeScript
│       ├── hooks/
│       │   ├── useAuth.ts                  # Hook de autenticação
│       │   └── useSales.ts                 # Hook para vendas (realtime)
│       ├── contexts/
│       │   └── AuthContext.tsx             # Contexto global de auth
│       ├── services/
│       │   └── saleService.ts              # Serviço de vendas
│       ├── lib/
│       │   └── supabaseClient.ts           # Cliente Supabase
│       └── components/
│           ├── sales/
│           │   ├── SalesFlowStepper.tsx    # Stepper principal
│           │   └── steps/
│           │       ├── StepValidation.tsx
│           │       ├── StepClientData.tsx
│           │       ├── StepAwaitingSignature.tsx
│           │       └── StepSuccess.tsx
│           └── admin/
│               ├── AdminDashboard.tsx      # Painel principal admin
│               ├── AdminSalesList.tsx      # Lista de vendas filtrada
│               └── AdminUserManagement.tsx # Gerenciamento de usuários
└── README.md (este arquivo)
```

---

## 🚀 Instalação e Setup

### 1. Clonar e instalar dependências

```bash
cd odonto-group-crud/frontend
npm install
# Dependencies: react, react-dom, vite, tailwindcss, react-hook-form, zod, @supabase/supabase-js
```

### 2. Configurar Supabase

#### 2.1 Criar projeto no Supabase
- Acesse [supabase.com](https://supabase.com)
- Crie um novo projeto
- Obtenha:
  - `SUPABASE_URL` (Settings → API)
  - `SUPABASE_ANON_KEY` (Settings → API)
  - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API)

#### 2.2 Executar migrations SQL
```sql
-- Copie o conteúdo de database/migrations/001_initial_schema.sql
-- e execute na seção SQL do Supabase Console
```

Isto irá criar:
- ENUMs: `user_role`, `sale_status`, `plan_type`
- Tabelas: `profiles`, `clients`, `sales`
- Índices para performance
- Triggers para `updated_at`
- **Políticas RLS completas**

#### 2.3 Deploy da Edge Function
```bash
# Primeiro, instale Supabase CLI
npm install -g supabase

# Faça login
supabase login

# Link ao projeto
supabase link --project-id seu_project_id

# Deploy da função
supabase functions deploy create-envelope

# Defina variáveis de ambiente (Supabase Console → Settings → Functions):
# - DOCUSEAL_API_KEY=sua_chave_docuseal
# - DOCUSEAL_TEMPLATE_ID=uuid_do_template
```

### 3. Configurar variáveis de ambiente Frontend

Crie `.env.local` na raiz do projeto frontend:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui

# Supabase realtime (habilitado por padrão, mas confirme)
```

### 4. Instalar e configurar DocuSeal

```bash
# 1. Crie conta em docuseal.com
# 2. Obtenha sua API Key no dashboard
# 3. Crie um Template com os campos necessários:
#    - client_name
#    - client_cpf
#    - plan_type
#    - signature_date
# 4. Copie o Template UUID
# 5. Defina em variáveis da Edge Function (passo 2.3)
```

### 5. Iniciar desenvolvimento

```bash
npm run dev
# Frontend rodará em http://localhost:5173
```

---

## 👥 Fluxo de Usuários

### Admin
1. Login com CPF + Senha
2. Acessa `/admin`
3. **Aba Vendas**:
   - Vê todas as vendas (filtro por status)
   - Aprova vendas assinadas (signed → approved_manually)
4. **Aba Usuários**:
   - Cria novos operadores (CPF, nome, senha, perfil)
   - Remove operadores

### Operador
1. Login com CPF + Senha
2. Acessa `/vendas`
3. **Passo 1**: Validação (confirma identidade)
4. **Passo 2**: Preenche dados do cliente
5. **Passo 3**: 
   - Sistema cria envelope no DocuSeal
   - Exibe link de assinatura
   - Operador copia e envia ao cliente
6. **Passo 4**: 
   - Realtime sincroniza quando cliente assina
   - Tela de sucesso confirma

---

## 🔐 Segurança (RLS Policies)

### Profiles Table
- ✅ Usuário vê seu próprio perfil
- ✅ Admins veem todos os perfis
- ✅ **Apenas Admins** criam/atualizam/deletam perfis

### Clients Table
- ✅ Operadores e Admins leem todos os clientes
- ✅ Operadores e Admins criam/atualizam clientes

### Sales Table
- ✅ Operadores veem apenas suas vendas
- ✅ Admins veem todas as vendas
- ✅ Operadores podem atualizar suas vendas
- ✅ Admins atualizam todas

---

## 🔄 Fluxo de Venda - Sequência

```
┌─────────────────────────────────────────────┐
│ Operador Logged In                          │
│ (role: operator)                            │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ PASSO 1: Validação                          │
│ ✓ Confirma identidade do operador           │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ PASSO 2: Dados do Cliente                   │
│ - Nome, CPF, Data de Nascimento             │
│ - Nome da Mãe, Endereço                     │
│ - Email, Telefone                           │
│ - Matrícula e Órgão (opcionais)             │
│ - Tipo de Plano                             │
│                                             │
│ [Cria Cliente se não existir]               │
│ [Cria Venda em status: draft]               │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ PASSO 3: Aguardando Assinatura              │
│                                             │
│ [Edge Function Create-Envelope]             │
│  ↓ Chama DocuSeal API                       │
│  ↓ Cria Envelope com Template               │
│  ↓ Retorna Link de Assinatura               │
│  ↓ Atualiza Venda (status: awaiting_sig)    │
│                                             │
│ [Realtime + Polling]                        │
│  ↓ Monitora mudanças na venda               │
│  ↓ Cliente assina via link DocuSeal         │
│  ↓ DocuSeal webhook atualiza venda          │
│  ↓ Status: signed                           │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ PASSO 4: Sucesso                            │
│ ✓ Venda registrada                          │
│ ✓ Aguardando aprovação do Admin             │
│                                             │
│ [Admin aprova]                              │
│ Status: approved_manually                   │
│ [Trigger Asaas Integration]                 │
│ (Fase 2)                                    │
└─────────────────────────────────────────────┘
```

---

## 📊 Banco de Dados - Schema

### profiles
```sql
id (UUID, FK auth.users)    | cpf (VARCHAR 11)  | nome (VARCHAR 255)
role (enum)                 | created_at        | updated_at
```

### clients
```sql
id (UUID)                   | nome (VARCHAR 255)          | cpf (VARCHAR 11, UNIQUE)
data_nascimento (DATE)      | nome_mae (VARCHAR 255)      | endereco_completo (TEXT)
email (VARCHAR 255)         | telefone (VARCHAR 20)       | matricula_origem (VARCHAR 100)
orgao_origem (VARCHAR 255)  | created_at                  | updated_at
```

### sales
```sql
id (UUID)                          | client_id (FK)        | operator_id (FK)
plan_type (enum)                   | status (enum)         | docuseal_submission_id (VARCHAR 255)
docuseal_link (TEXT)               | created_at            | updated_at
```

---

## 🔌 Edge Function - create-envelope

**Endpoint**: `https://seu-projeto.supabase.co/functions/v1/create-envelope`

**Método**: POST

**Autenticação**: Bearer Token (Authorization header obrigatório)

**Request Body**:
```json
{
  "saleId": "uuid-da-venda",
  "clientId": "uuid-do-cliente",
  "clientName": "João Silva",
  "clientEmail": "joao@example.com",
  "clientCPF": "12345678901",
  "planType": "plano_standard"
}
```

**Response (200)**:
```json
{
  "success": true,
  "docuSealSubmissionId": "docuseal-id",
  "docuSealLink": "https://docuseal.com/s/uuid-submission",
  "message": "Envelope created successfully. Share the link with the client."
}
```

**Response (error)**:
```json
{
  "error": "Failed to create DocuSeal submission",
  "details": "..."
}
```

---

## 🎨 Componentes React - Uso

### SalesFlowStepper
```tsx
import SalesFlowStepper from '@/components/sales/SalesFlowStepper';

function App() {
  return <SalesFlowStepper />;
}
```

### AdminDashboard
```tsx
import AdminDashboard from '@/components/admin/AdminDashboard';

function App() {
  return <AdminDashboard />;
}
```

### Hooks
```tsx
import { useAuth, useIsAdmin, useIsOperator } from '@/hooks/useAuth';
import { useSales, useSaleRealtime } from '@/hooks/useSales';

function MyComponent() {
  const { user, loginWithCPF, logout } = useAuth();
  const { sales, loading } = useSales();
  const { sale } = useSaleRealtime(saleId);
  
  return <div>{/* ... */}</div>;
}
```

---

## 📦 Dependências

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "@supabase/supabase-js": "^2.38.0",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.2.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

---

## 🧪 Testing (Sugestões)

### Teste de Fluxo Manual
1. **Login Admin**: CPF válido, role: admin
2. **Criar Operador**: Admin cria novo operador
3. **Login Operador**: Com CPF do novo operador
4. **Criar Venda**: Preencher todos os passos
5. **Verificar Realtime**: Abrir link DocuSeal em outra aba, assinar
6. **Aprovar no Admin**: Admin aprova venda assinada

---

## 🐛 Troubleshooting

### "Unauthorized" na Edge Function
- ✅ Verificar se Authorization header está sendo enviado
- ✅ Confirmar que o token é válido (Bearer token do Supabase Auth)

### "Missing required fields" no DocuSeal
- ✅ Verificar se todos os campos estão preenchidos no formulário
- ✅ Validação Zod está rejeitando dados inválidos?

### Link de Assinatura não sincroniza
- ✅ Supabase Realtime habilitado? (Settings → Realtime)
- ✅ RLS policy permite read na tabela sales?
- ✅ Verificar console do browser para erros

### "Only admins can create profiles"
- ✅ Confirmado que o usuário é admin?
- ✅ RLS policy está correta?

---

## 📝 Próximos Passos (Fase 2)

- ✅ **Webhook DocuSeal**: Atualizar status venda automaticamente quando assinada
- ✅ **Integração Asaas**: Edge Function para processar pagamento quando status = approved_manually
- ✅ **Notificações**: Email para operador e cliente
- ✅ **Dashboard Operador**: Visualizar suas próprias vendas
- ✅ **Relatórios**: Admin gera relatórios de vendas

---

## 📞 Suporte

Para dúvidas sobre a implementação, consulte:
- [Supabase Docs](https://supabase.com/docs)
- [DocuSeal API](https://www.docuseal.com/developers)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)

---

**Versão**: 1.0.0  
**Data**: Fevereiro 2026  
**Autor**: Engenheiro de Software Sênior - React + Supabase
