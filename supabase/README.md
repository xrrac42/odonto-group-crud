# Supabase Edge Functions - OdontoGroup

Funções serverless Deno para integração com DocuSeal.

## create-envelope

Cria um envelope de assinatura digital no DocuSeal.

### Configuração

1. Deploy:
```bash
supabase link --project-id seu_project_id
supabase functions deploy create-envelope
```

2. Defina secrets (Supabase Console → Settings → Functions → Secrets):
```
DOCUSEAL_API_KEY = sua_chave_api_docuseal
DOCUSEAL_TEMPLATE_ID = uuid_do_seu_template
SUPABASE_URL = https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY = sua_service_role_key
```

### Request

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/create-envelope \
  -H "Authorization: Bearer seu_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "saleId": "uuid-da-venda",
    "clientId": "uuid-do-cliente",
    "clientName": "João Silva",
    "clientEmail": "joao@example.com",
    "clientCPF": "12345678901",
    "planType": "plano_standard"
  }'
```

### Response

Success (200):
```json
{
  "success": true,
  "docuSealSubmissionId": "12345",
  "docuSealLink": "https://docuseal.com/s/uuid-submission",
  "message": "Envelope created successfully. Share the link with the client."
}
```

Error (500):
```json
{
  "error": "Failed to create DocuSeal submission",
  "details": "..."
}
```

### Fluxo Interno

1. Valida Authorization header
2. Parse request body
3. Valida campos obrigatórios
4. Chama DocuSeal API com payload
5. Extrai submission_id e submission_uuid
6. Gera link de assinatura
7. Atualiza status da venda para "awaiting_signature"
8. Retorna link e ID

### Segurança

✅ **API Key isolada em secrets** (não fica no frontend)
✅ **Autenticação obrigatória** (requer Bearer token)
✅ **CORS habilitado** para requests do frontend
✅ **Validação de entrada** com verificações

### DocuSeal Template

Configure seu template com os campos:
- `client_name` - Nome do cliente
- `client_cpf` - CPF do cliente
- `plan_type` - Tipo de plano
- `signature_date` - Data de assinatura

### Logs

Monitore na Supabase Console → Functions → Logs

```bash
supabase functions list
```

### Webhook (Próximo)

Configure webhook no DocuSeal para atualizar status automaticamente quando assinado.

---

**Version**: 1.0.0  
**Runtime**: Deno 1.40+
