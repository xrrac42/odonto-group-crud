// services/saleService.ts
import { supabase, BACKEND_URL, getUserJWT } from '../lib/supabaseClient';
import type { Sale, SaleFormData, CreateEnvelopeResponse } from '../types';
import { getPlanTypeForBackend } from '../constants/products';

export const saleService = {
  /**
   * Criar um novo draft de venda
   */
  async createDraft(operatorId: string): Promise<Sale> {
    console.log('📝 createDraft: Iniciando criação...');
    
    // Removido forceCleanAllChannels. Deve ser feito apenas na desmontagem de componentes UI.

    const { data, error } = await supabase
      .from('sales')
      .insert([
        {
          operator_id: operatorId,
          status: 'draft',
          plan_type: 'plano_basico',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar draft:', error);
      // Tratamento específico para o erro de migração comum
      if (error.code === '23502' && error.message.includes('client_id')) {
        throw new Error('Erro de configuração no banco: client_id não pode ser nulo.');
      }
      throw error;
    }

    return data as Sale;
  },

  /**
   * Recuperar draft por ID
   * REMOVIDO: Promise.race e Timeouts manuais que causavam travamento
   */
  async getDraft(draftId: string): Promise<Sale | null> {
    // Busca simples e direta. Se demorar, deixamos o supabase gerenciar a conexão.
    const { data, error } = await supabase
      .from('sales')
      .select('*, client:clients(*)')
      .eq('id', draftId)
      .maybeSingle(); // maybeSingle é mais seguro que single() para retornos nulos

    if (error) {
      console.error('❌ Erro ao buscar draft:', error);
      // Não lançamos erro, retornamos null para a UI decidir o que fazer
      return null;
    }

    return data as Sale;
  },

  /**
   * Atualizar dados parciais
   */
  async updateDraft(draftId: string, updates: Partial<Sale>): Promise<Sale> {
    const { data, error } = await supabase
      .from('sales')
      .update(updates)
      .eq('id', draftId)
      .select()
      .single();

    if (error) throw error;
    return data as Sale;
  },

  /**
   * Vincular cliente ao draft existente
   */
  async linkClientToDraft(draftId: string, formData: SaleFormData): Promise<Sale> {
    let clientId: string;

    // 1. Verificar se cliente existe
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('cpf', formData.client_cpf!)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
      
      // Opcional: Atualizar dados do cliente existente se necessário
      await supabase
        .from('clients')
        .update({
            nome: formData.client_nome,
            email: formData.client_email,
            telefone: formData.client_telefone,
            endereco_completo: formData.client_endereco_completo,
            rg: formData.client_rg,
            orgao_expedidor: formData.client_orgao_expedidor,
            sexo: formData.client_sexo,
            estado_civil: formData.client_estado_civil,
            nome_social: formData.client_nome_social,
            endereco_logradouro: formData.client_endereco_logradouro,
            endereco_numero: formData.client_endereco_numero,
            endereco_complemento: formData.client_endereco_complemento,
            endereco_bairro: formData.client_endereco_bairro,
            endereco_cidade: formData.client_endereco_cidade,
            endereco_uf: formData.client_endereco_uf,
            endereco_cep: formData.client_endereco_cep,
        })
        .eq('id', clientId);

    } else {
      // 2. Criar novo cliente
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert([
          {
            nome: formData.client_nome!,
            cpf: formData.client_cpf!,
            data_nascimento: formData.client_data_nascimento!,
            nome_mae: formData.client_nome_mae!,
            endereco_completo: formData.client_endereco_completo!,
            email: formData.client_email!,
            telefone: formData.client_telefone!,
            matricula_origem: formData.client_matricula_origem,
            orgao_origem: formData.client_orgao_origem,
            rg: formData.client_rg,
            orgao_expedidor: formData.client_orgao_expedidor,
            sexo: formData.client_sexo,
            estado_civil: formData.client_estado_civil,
            nome_social: formData.client_nome_social,
            endereco_logradouro: formData.client_endereco_logradouro,
            endereco_numero: formData.client_endereco_numero,
            endereco_complemento: formData.client_endereco_complemento,
            endereco_bairro: formData.client_endereco_bairro,
            endereco_cidade: formData.client_endereco_cidade,
            endereco_uf: formData.client_endereco_uf,
            endereco_cep: formData.client_endereco_cep,
          },
        ])
        .select()
        .single();

      if (clientError) throw clientError;
      clientId = newClient.id;
    }

    // 3. Atualizar a venda
    // IMPORTANTE: Não salvamos plan_type aqui! Novos planos são salvos apenas no backend Go
    // O plan_type antigo (plano_basico) é mantido no Supabase para compatibilidade
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .update({
        client_id: clientId,
        // plan_type não é atualizado - os novos planos são salvos apenas no backend Go
        forma_pagamento: formData.forma_pagamento,
        periodicidade_cobranca: formData.periodicidade_cobranca,
        valor_mensal: formData.valor_mensal,
        unidade_consumo: formData.client_unidade_consumo,
        energia_companhia: formData.energia_companhia,
        pagamento_banco: formData.pagamento_banco,
        pagamento_agencia: formData.pagamento_agencia,
        pagamento_conta: formData.pagamento_conta,
        pagamento_orgao: formData.pagamento_orgao,
        pagamento_matricula: formData.pagamento_matricula,
        has_dependents: !!formData.has_dependents,
        dependents: formData.dependents,
      })
      .eq('id', draftId)
      .select()
      .single();

    if (saleError) throw saleError;

    return sale as Sale;
  },

  /**
   * Criar venda completa (Legado/Fallback)
   */
  async createSale(formData: SaleFormData, operatorId: string): Promise<Sale> {
    // Reutiliza a lógica de criar draft + vincular para evitar código duplicado
    const draft = await this.createDraft(operatorId);
    return await this.linkClientToDraft(draft.id, formData);
  },

  /**
   * Edge Function para criar envelope
   */
  async createEnvelope(
    saleId: string,
    clientData: {
      nome: string;
      email: string;
      cpf: string;
      telefone?: string;
      data_nascimento?: string;
      nome_mae?: string;
      endereco_completo?: string;
      matricula_origem?: string;
      orgao_origem?: string;
      // Campos plano_beta
      rg?: string;
      orgao_expedidor?: string;
      sexo?: string;
      estado_civil?: string;
      nome_social?: string;
      endereco_logradouro?: string;
      endereco_numero?: string;
      endereco_complemento?: string;
      endereco_bairro?: string;
      endereco_cidade?: string;
      endereco_uf?: string;
      endereco_cep?: string;
    },
    saleData: {
      plan_type: string;
      forma_pagamento?: string;
      periodicidade_cobranca?: string;
      valor_mensal?: number;
      unidade_consumo?: string;
      energia_companhia?: string;
      pagamento_banco?: string;
      pagamento_agencia?: string;
      pagamento_conta?: string;
      pagamento_orgao?: string;
      pagamento_matricula?: string;
      has_dependents?: boolean;
      dependents?: string;
    },
    operatorId: string
  ): Promise<CreateEnvelopeResponse> {
    // Gerar UUID único para rastreamento
    const uniqueClientId = crypto.randomUUID();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      // Get the user's JWT token instead of using the API key
      const jwt = await getUserJWT();
      if (!jwt) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Construir payload com apenas campos que têm valores
      const payload: Record<string, any> = {
        saleId,
        clientId: uniqueClientId,
        clientName: clientData.nome,
        clientEmail: clientData.email,
        clientCPF: clientData.cpf,
        clientBirthDate: clientData.data_nascimento,
        clientMotherName: clientData.nome_mae,
        // Campos de endereço obrigatórios
        clientEnderecoLogradouro: clientData.endereco_logradouro,
        clientEnderecoNumero: clientData.endereco_numero,
        clientEnderecoComplemento: clientData.endereco_complemento,
        clientEnderecoBairro: clientData.endereco_bairro,
        clientEnderecoCidade: clientData.endereco_cidade,
        clientEnderecoUF: clientData.endereco_uf,
        clientEnderecoCEP: clientData.endereco_cep,
        // Dados da venda
        planType: getPlanTypeForBackend(saleData.plan_type),
        operatorId,
      };

      // Adicionar campos opcionais apenas se preenchidos
      if (clientData.telefone) payload.clientPhone = clientData.telefone;
      if (clientData.rg) payload.clientRG = clientData.rg;
      if (clientData.orgao_expedidor) payload.clientOrgaoExpedidor = clientData.orgao_expedidor;
      if (clientData.sexo) payload.clientSexo = clientData.sexo;
      if (clientData.estado_civil) payload.clientEstadoCivil = clientData.estado_civil;
      if (clientData.nome_social) payload.clientNomeSocial = clientData.nome_social;
      
      // Campos de pagamento - incluir apenas se preenchidos (não null e não undefined)
      if (saleData.forma_pagamento != null) payload.formaPagamento = saleData.forma_pagamento;
      if (saleData.periodicidade_cobranca != null) payload.periodicidadeCobranca = saleData.periodicidade_cobranca;
      if (saleData.valor_mensal != null) payload.valorMensal = saleData.valor_mensal;
      if (saleData.unidade_consumo != null) payload.unidadeConsumo = saleData.unidade_consumo;
      if (saleData.energia_companhia != null) payload.energiaCompanhia = saleData.energia_companhia;
      if (saleData.pagamento_banco != null) payload.pagamentoBanco = saleData.pagamento_banco;
      if (saleData.pagamento_agencia != null) payload.pagamentoAgencia = saleData.pagamento_agencia;
      if (saleData.pagamento_conta != null) payload.pagamentoConta = saleData.pagamento_conta;
      if (saleData.pagamento_orgao != null) payload.pagamentoOrgao = saleData.pagamento_orgao;
      if (saleData.pagamento_matricula != null) payload.pagamentoMatricula = saleData.pagamento_matricula;
      if (saleData.has_dependents != null) payload.hasDependents = saleData.has_dependents;
      if (saleData.dependents != null) payload.dependents = saleData.dependents;

      const response = await fetch(
        `${BACKEND_URL}/api/envelopes/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
          },
          signal: controller.signal,
          body: JSON.stringify(payload),
        }
      );

      const raw = await response.text();
      const parsed = raw ? JSON.parse(raw) : null;

      if (!response.ok) {
        throw new Error(
          parsed?.message || parsed?.error || `Erro ao criar envelope (${response.status})`
        );
      }

      return parsed as CreateEnvelopeResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout ao criar envelope. Verifique template do plano e tente novamente.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async updateSaleStatus(
    saleId: string,
    status: 'draft' | 'awaiting_signature' | 'signed' | 'approved_manually'
  ): Promise<Sale> {
    const { data, error } = await supabase
      .from('sales')
      .update({ status })
      .eq('id', saleId)
      .select()
      .single();

    if (error) throw error;
    return data as Sale;
  },

  async getSaleWithClient(saleId: string) {
    const { data, error } = await supabase
      .from('sales')
      .select('*, client:clients(*)')
      .eq('id', saleId)
      .single();

    if (error) throw error;
    return data;
  },

  async getOperatorSales(operatorId: string) {
    const { data, error } = await supabase
      .from('sales')
      .select('*, client:clients(*)')
      .eq('operator_id', operatorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAllSales() {
    const { data, error } = await supabase
      .from('sales')
      .select('*, client:clients(*), operator:profiles(nome, cpf)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async approveSale(saleId: string): Promise<Sale> {
    const { data, error } = await supabase
      .from('sales')
      .update({ status: 'approved_manually' })
      .eq('id', saleId)
      .select()
      .single();

    if (error) throw error;
    return data as Sale;
  },

  async rejectSale(saleId: string): Promise<Sale> {
    const { data, error } = await supabase
      .from('sales')
      .update({ status: 'draft' })
      .eq('id', saleId)
      .select()
      .single();

    if (error) throw error;
    return data as Sale;
  },
};