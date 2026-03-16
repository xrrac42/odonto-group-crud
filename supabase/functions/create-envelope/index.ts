import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Tipos
interface CreateEnvelopeRequest {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientCPF: string;
  clientPhone: string;
  clientBirthDate: string;
  clientMotherName: string;
  clientAddress: string;
  clientMatricula?: string;
  clientOrgao?: string;
  // Novos campos para plano_beta
  clientRG?: string;
  clientOrgaoExpedidor?: string;
  clientSexo?: string;
  clientEstadoCivil?: string;
  clientNomeSocial?: string;
  clientEnderecoLogradouro?: string;
  clientEnderecoNumero?: string;
  clientEnderecoComplemento?: string;
  clientEnderecoBairro?: string;
  clientEnderecoCidade?: string;
  clientEnderecoUF?: string;
  clientEnderecoCEP?: string;
  // Dados da venda
  planType: string;
  formaPagamento?: string;
  periodicidadeCobranca?: string;
  valorMensal?: number;
  unidadeConsumo?: string;
  saleId: string;
  operatorId: string; // ID do operador que está criando a venda
}

interface DocuSealResponse {
  submission_id: string;
  documents: Array<{
    uuid: string;
  }>;
  submitters: Array<{
    uuid: string;
    slug: string;
    email: string;
    embed_src: string;
  }>;
  submission_uuid: string;
  send_email: boolean;
  created_at: string;
}

interface DocuSealEnvelopeResponse {
  slug: string;
  completed_at: null | string;
  created_at: string;
  documents_count: number;
  expire_at: string;
  fields_count: number;
  id: string;
  name: string;
  send_email: boolean;
  signed_at: null | string;
  signers: Array<{
    uuid: string;
    name: string;
    email: string;
  }>;
  source_submission_id: string | null;
  status: string;
  template_id: null | string;
  uuid: string;
}

const DOCUSEAL_API_KEY = Deno.env.get("DOCUSEAL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Templates do DocuSeal por plano
const DOCUSEAL_TEMPLATES = {
  plano_alfa: Deno.env.get("DOCUSEAL_TEMPLATE_ID_ALFA") || "",
  plano_beta: Deno.env.get("DOCUSEAL_TEMPLATE_ID_BETA") || "",
  plano_delta: Deno.env.get("DOCUSEAL_TEMPLATE_ID_DELTA") || "",
  // Fallback para planos antigos (opcional)
  plano_basico: Deno.env.get("DOCUSEAL_TEMPLATE_ID_BASICO") || "",
  plano_standard: Deno.env.get("DOCUSEAL_TEMPLATE_ID_STANDARD") || "",
  plano_premium: Deno.env.get("DOCUSEAL_TEMPLATE_ID_PREMIUM") || "",
};

// Função para selecionar template baseado no plano
function getTemplateIdForPlan(planType: string): string {
  const templateId = DOCUSEAL_TEMPLATES[planType as keyof typeof DOCUSEAL_TEMPLATES];
  
  if (!templateId) {
    throw new Error(`Template não configurado para o plano: ${planType}`);
  }
  
  return templateId;
}

function onlyDefinedStringFields(fields: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  );
}

function formatDateBR(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

function formatCurrencyBR(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function normalizeCEP(value?: string): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}

function extractCEPFromAddress(address?: string): string | null {
  if (!address) return null;
  const match = address.match(/(\d{5}-?\d{3})/);
  return normalizeCEP(match?.[1]);
}

function extractNumberFromAddress(address?: string): string | null {
  if (!address) return null;
  const match = address.match(/\b(\d{1,6})\b/);
  return match?.[1] || null;
}

async function resolveAddressByCEP(cep: string): Promise<{
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}> {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) return {};
    const data = await response.json();
    if (data?.erro) return {};
    return {
      logradouro: data?.logradouro,
      bairro: data?.bairro,
      cidade: data?.localidade,
      uf: data?.uf,
    };
  } catch {
    return {};
  }
}

async function buildDocuSealFields(payload: CreateEnvelopeRequest): Promise<Record<string, string>> {
  const planoLabelMap: Record<string, string> = {
    plano_alfa: 'Plano Alfa',
    plano_beta: 'Plano Beta',
    plano_delta: 'Plano Delta',
    plano_basico: 'Plano Básico',
    plano_standard: 'Plano Standard',
    plano_premium: 'Plano Premium',
  };

  const formaPagamentoLabelMap: Record<string, string> = {
    conta_luz: 'Conta de Luz',
    pix: 'Pix',
    cartao_credito: 'Cartão de Crédito',
  };

  const cepCandidate = normalizeCEP(payload.clientEnderecoCEP) || extractCEPFromAddress(payload.clientAddress);
  const cepData = cepCandidate ? await resolveAddressByCEP(cepCandidate) : {};

  const enderecoFormatado = payload.clientEnderecoLogradouro
    ? `${payload.clientEnderecoLogradouro}, ${payload.clientEnderecoNumero || "S/N"}${
        payload.clientEnderecoComplemento ? ", " + payload.clientEnderecoComplemento : ""
      } - ${payload.clientEnderecoBairro || "Não informado"} - ${payload.clientEnderecoCidade || "Não informado"}/${payload.clientEnderecoUF || "NI"} - CEP: ${payload.clientEnderecoCEP || "Não informado"}`
    : payload.clientAddress;

  const resolvedLogradouro = payload.clientEnderecoLogradouro || cepData.logradouro || payload.clientAddress || "Não informado";
  const resolvedNumero = payload.clientEnderecoNumero || extractNumberFromAddress(payload.clientAddress) || "S/N";
  const resolvedBairro = payload.clientEnderecoBairro || cepData.bairro || "Não informado";
  const resolvedCidade = payload.clientEnderecoCidade || cepData.cidade || "Não informado";
  const resolvedUF = payload.clientEnderecoUF || cepData.uf || "NI";
  const resolvedCEP = cepCandidate
    ? `${cepCandidate.slice(0, 5)}-${cepCandidate.slice(5)}`
    : (payload.clientEnderecoCEP || "Não informado");

  const formaPagamento = formaPagamentoLabelMap[payload.formaPagamento || ""] || payload.formaPagamento || "Não informado";
  const valorMensal = typeof payload.valorMensal === "number" && payload.valorMensal > 0
    ? formatCurrencyBR(payload.valorMensal)
    : "Não informado";
  const periodicidadeFixa = "Mensal";
  const local = `${resolvedCidade}/${resolvedUF}`;
  const dataAtual = formatDateBR(new Date());

  return onlyDefinedStringFields({
    // CONTRATO
    "Produto Contratado": planoLabelMap[payload.planType] || payload.planType || "Não informado",
    "ID proposta": payload.saleId || "Não informado",
    "ID do Associado / Proposta": payload.saleId || "Não informado",
    "Periodicidade cobrança": periodicidadeFixa,
    "Periodicidade da cobrança": periodicidadeFixa,
    "Valor Mensal": valorMensal,
    "Forma de Pagamento": formaPagamento,
    "Forma Pagamento": formaPagamento,

    // DADOS PESSOAIS
    "Nome": payload.clientName || "",
    "Data Nascimento": payload.clientBirthDate || "",
    "Data de Nascimento": payload.clientBirthDate || "",
    "CPF": payload.clientCPF || "",
    "RG": payload.clientRG || "",
    "Órgão Expedidor": payload.clientOrgaoExpedidor || "",
    "Sexo": payload.clientSexo || "",
    "Estado Civil": payload.clientEstadoCivil || "",
    "Telefone Celular": payload.clientPhone || "",
    "Nome Social": payload.clientNomeSocial || "",
    "E-mail": payload.clientEmail?.trim() || "",
    "Email": payload.clientEmail?.trim() || "",

    // ENDEREÇO
    "Endereço": resolvedLogradouro || enderecoFormatado || "Não informado",
    "Número": resolvedNumero,
    "Complemento": payload.clientEnderecoComplemento || "-",
    "Bairro": resolvedBairro,
    "Cidade": resolvedCidade,
    "UF": resolvedUF,
    "CEP": resolvedCEP,
    "Unidade de Consumo": payload.unidadeConsumo || "",
    "Local": local,

    // ASSINATURA
    // "Assinatura" é campo de assinatura do DocuSeal e não deve ser pré-preenchido.
    "Data": dataAtual,
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

serve(async (req: Request) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    // Validar método
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parsear body
    const body: CreateEnvelopeRequest = await req.json();
    const {
      clientId,
      clientName,
      clientEmail,
      clientCPF,
      clientPhone,
      clientBirthDate,
      clientMotherName,
      clientAddress,
      clientMatricula,
      clientOrgao,
      // Novos campos plano_beta
      clientRG,
      clientOrgaoExpedidor,
      clientSexo,
      clientEstadoCivil,
      clientNomeSocial,
      clientEnderecoLogradouro,
      clientEnderecoNumero,
      clientEnderecoComplemento,
      clientEnderecoBairro,
      clientEnderecoCidade,
      clientEnderecoUF,
      clientEnderecoCEP,
      // Dados da venda
      planType,
      formaPagamento,
      periodicidadeCobranca,
      valorMensal,
      unidadeConsumo,
      saleId,
      operatorId,
    } = body;

    // Validações básicas (apenas campos essenciais)
    if (
      !clientId ||
      !clientName ||
      !clientEmail ||
      !clientCPF ||
      !planType ||
      !saleId ||
      !operatorId
    ) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Inicializar cliente Supabase com service role
    const supabase = createClient(
      SUPABASE_URL || "",
      SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Verificar se o operatorId existe e tem role válido
    const { data: operatorProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", operatorId)
      .single();

    if (profileError || !operatorProfile) {
      return new Response(
        JSON.stringify({ 
          error: "Forbidden", 
          details: "Invalid operator"
        }), 
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Processing request for operator:", operatorId);

    // Debug: verificar se API key está configurada
    console.log("DocuSeal API Key exists:", !!DOCUSEAL_API_KEY);

    if (!DOCUSEAL_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "DocuSeal API key not configured",
          message: "Please set DOCUSEAL_API_KEY secret in Supabase Dashboard"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Selecionar template correto baseado no plano
    let templateId: string;
    try {
      templateId = getTemplateIdForPlan(planType);
      console.log(`Plano: ${planType} -> Template ID: ${templateId}`);
    } catch (err) {
      console.error("Erro ao selecionar template:", err);
      return new Response(
        JSON.stringify({
          error: "Template configuration error",
          message: err instanceof Error ? err.message : "Template não encontrado"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Carregar dados da venda para fallback de campos críticos (pagamento/valor/plano)
    const { data: saleSnapshot, error: saleSnapshotError } = await supabase
      .from("sales")
      .select("id, plan_type, forma_pagamento, valor_mensal, periodicidade_cobranca, client:clients(email, endereco_cidade, endereco_uf)")
      .eq("id", saleId)
      .single();

    if (saleSnapshotError || !saleSnapshot) {
      return new Response(
        JSON.stringify({
          error: "Sale not found",
          details: saleSnapshotError,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const effectivePayload: CreateEnvelopeRequest = {
      ...body,
      planType: body.planType || saleSnapshot.plan_type,
      formaPagamento: body.formaPagamento || saleSnapshot.forma_pagamento || undefined,
      valorMensal:
        typeof body.valorMensal === "number" && body.valorMensal > 0
          ? body.valorMensal
          : (saleSnapshot.valor_mensal as number | null) ?? undefined,
      // Chumbado: sempre mensal
      periodicidadeCobranca: "mensal",
      clientEmail:
        body.clientEmail?.trim() ||
        (saleSnapshot.client as { email?: string } | null)?.email ||
        "",
      clientEnderecoCidade:
        body.clientEnderecoCidade || (saleSnapshot.client as { endereco_cidade?: string } | null)?.endereco_cidade,
      clientEnderecoUF:
        body.clientEnderecoUF || (saleSnapshot.client as { endereco_uf?: string } | null)?.endereco_uf,
    };

    if (!effectivePayload.formaPagamento) {
      return new Response(
        JSON.stringify({
          error: "Missing payment method",
          message: "Forma de Pagamento é obrigatória",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Effective payload snapshot:", {
      planType: effectivePayload.planType,
      formaPagamento: effectivePayload.formaPagamento,
      valorMensal: effectivePayload.valorMensal,
      periodicidadeCobranca: effectivePayload.periodicidadeCobranca,
    });

    // 1. Criar submissão no DocuSeal
    const cepToValidate = normalizeCEP(clientEnderecoCEP) || extractCEPFromAddress(clientAddress);
    if (cepToValidate) {
      const cepData = await resolveAddressByCEP(cepToValidate);
      if (!cepData.uf) {
        return new Response(
          JSON.stringify({
            error: "CEP inválido",
            message: "Não foi possível validar o CEP no ViaCEP",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const mappedFields = await buildDocuSealFields(effectivePayload);

    const prefillFieldsAsArray = Object.entries(mappedFields).map(([name, value]) => ({
      name,
      default_value: value,
      readonly: true,
    }));

    const docuSealPayload = {
      send_email: false, // Não enviar email automático, operador enviará link
      submitters: [
        {
          name: effectivePayload.clientName,
          email: effectivePayload.clientEmail?.trim(),
          // Forma recomendada pelo DocuSeal para pré-preencher campos
          values: mappedFields,
          // Garante bloqueio dos campos preenchidos para o cliente só assinar
          fields: prefillFieldsAsArray,
        },
      ],
      template_id: templateId,
      name: `Contrato Odontológico - ${clientName} - ${effectivePayload.planType}`,
      // Mantido como fallback para templates que exigem config por campo
      fields: prefillFieldsAsArray,
    };

    console.log("Mapped DocuSeal fields:", Object.keys(mappedFields));

    console.log("Calling DocuSeal API with template:", templateId);

    const docuSealController = new AbortController();
    const docuSealTimeout = setTimeout(() => docuSealController.abort(), 20000);

    let docuSealResponse: Response;
    try {
      docuSealResponse = await fetch("https://api.docuseal.com/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": DOCUSEAL_API_KEY,
        },
        signal: docuSealController.signal,
        body: JSON.stringify(docuSealPayload),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return new Response(
          JSON.stringify({
            error: "DocuSeal timeout",
            message: `Timeout ao criar submissão no DocuSeal para plano ${effectivePayload.planType}`,
          }),
          {
            status: 504,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw err;
    } finally {
      clearTimeout(docuSealTimeout);
    }

    console.log("DocuSeal response status:", docuSealResponse.status);

    if (!docuSealResponse.ok) {
      const errorData = await docuSealResponse.text();
      console.error("DocuSeal API Error:", errorData);
      return new Response(
        JSON.stringify({
          error: "Failed to create DocuSeal submission",
          details: errorData,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const docuSealData = await docuSealResponse.json();
    console.log("DocuSeal response data:", JSON.stringify(docuSealData));

    // Compatível com resposta em array ou objeto
    const firstSubmitter = Array.isArray(docuSealData)
      ? docuSealData[0]
      : docuSealData?.submitters?.[0];
    const firstSubmitterId = firstSubmitter?.id;
    const submitterSlug = firstSubmitter?.slug;
    const submissionId = Array.isArray(docuSealData)
      ? docuSealData?.[0]?.submission_id
      : docuSealData?.submission_id;

    if (!submitterSlug || !submissionId) {
      console.error("Invalid DocuSeal response format:", docuSealData);
      return new Response(
        JSON.stringify({
          error: "Invalid DocuSeal response",
          details: docuSealData,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Reforça pré-preenchimento diretamente no submitter (garante E-mail e Periodicidade)
    if (firstSubmitterId) {
      const criticalValues = {
        "E-mail": mappedFields["E-mail"] || effectivePayload.clientEmail?.trim() || "",
        "E-mail ": mappedFields["E-mail"] || effectivePayload.clientEmail?.trim() || "",
        "E‑mail": mappedFields["E-mail"] || effectivePayload.clientEmail?.trim() || "",
        "Email": mappedFields["Email"] || effectivePayload.clientEmail?.trim() || "",
        "Periodicidade": "Mensal",
        "Periodicidade ": "Mensal",
        "Forma de Pagamento": mappedFields["Forma de Pagamento"] || "Não informado",
        "Valor Mensal": mappedFields["Valor Mensal"] || "Não informado",
      };

      const submitterUpdateResponse = await fetch(`https://api.docuseal.com/submitters/${firstSubmitterId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": DOCUSEAL_API_KEY,
        },
        body: JSON.stringify({
          values: criticalValues,
          fields: Object.entries(criticalValues).map(([name, default_value]) => ({
            name,
            default_value,
            readonly: true,
          })),
        }),
      });

      if (!submitterUpdateResponse.ok) {
        const updateText = await submitterUpdateResponse.text();
        console.warn("DocuSeal submitter update warning:", updateText);
      }
    }

    console.log("Submitter slug:", submitterSlug);
    console.log("Submission ID:", submissionId);

    // 2. Gerar link de assinatura usando o slug do submitter
    const docuSealLink = `https://docuseal.com/s/${submitterSlug}`;
    
    console.log("Generated link:", docuSealLink);

    // 3. Atualizar venda no Supabase com IDs do DocuSeal
    const { error: updateError } = await supabase
      .from("sales")
      .update({
        status: "awaiting_signature",
        docuseal_submission_id: submissionId,
        docuseal_link: docuSealLink,
      })
      .eq("id", saleId);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update sale status",
          details: updateError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Retornar resposta de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        docuSealSubmissionId: submissionId,
        docuSealLink: docuSealLink,
        message:
          "Envelope created successfully. Share the link with the client.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in create-envelope function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
