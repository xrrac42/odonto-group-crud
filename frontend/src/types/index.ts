// types/index.ts
export type UserRole = 'admin' | 'operator';
export type SaleStatus = 'draft' | 'awaiting_signature' | 'signed' | 'approved_manually';
export type PlanType = 
  | 'ligue_bem_estar'
  | 'ligue_familia_protegida'
  | 'ligue_protecao_360'
  | 'odonto_caixa_alfa'
  | 'odonto_caixa_beta'
  | 'odonto_caixa_delta'
  | 'ligue_saude_em_dia'
  | 'ligue_viver_bem'
  | 'liga_vida_plena'
  | 'ligue_mais_cuidado'
  | 'ligue_cuidado_total';
export type PaymentMethod =
  | 'conta_energia'
  | 'boleto'
  | 'pix_automatico'
  | 'debito_conta'
  | 'desconto_folha';

export interface Profile {
  id: string;
  cpf: string;
  nome: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string; // ISO date
  nome_mae: string;
  endereco_completo: string;
  email: string;
  telefone: string;
  matricula_origem?: string;
  orgao_origem?: string;
  // Novos campos para plano_beta
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
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  client_id: string;
  operator_id: string;
  plan_type: PlanType;
  status: SaleStatus;
  docuseal_submission_id?: string;
  docuseal_link?: string;
  // Campos de pagamento (plano_beta)
  forma_pagamento?: string; // 'conta_energia' | 'boleto' | 'pix_automatico' | 'debito_conta' | 'desconto_folha'
  periodicidade_cobranca?: string; // 'mensal' | 'anual'
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
  created_at: string;
  updated_at: string;
  // Relacionamentos opcionais (com join)
  client?: Client;
  operator?: Profile;
}

export interface SaleWithClient extends Sale {
  client: Client;
}

export interface CreateEnvelopeRequest {
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
  // Novos campos plano_beta
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
  energiaCompanhia?: string;
  pagamentoBanco?: string;
  pagamentoAgencia?: string;
  pagamentoConta?: string;
  pagamentoOrgao?: string;
  pagamentoMatricula?: string;
  hasDependents?: boolean;
  dependents?: string;
  saleId: string;
}

export interface CreateEnvelopeResponse {
  success: boolean;
  docuSealSubmissionId: string;
  docuSealLink: string;
  message: string;
}

export interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  error: string | null;
  loginWithCPF: (cpf: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isOperator: boolean;
}

export interface SaleFormData {
  // Passo 1: Validação (automático com auth)
  
  // Passo 2: Dados do Cliente
  client_nome?: string;
  client_cpf?: string;
  client_data_nascimento?: string;
  client_nome_mae?: string;
  client_endereco_completo?: string;
  client_email?: string;
  client_telefone?: string;
  client_matricula_origem?: string;
  client_orgao_origem?: string;
  
  // Novos campos para plano_beta
  client_rg?: string;
  client_orgao_expedidor?: string;
  client_sexo?: string;
  client_estado_civil?: string;
  client_nome_social?: string;
  client_unidade_consumo?: string;
  client_endereco_logradouro?: string;
  client_endereco_numero?: string;
  client_endereco_complemento?: string;
  client_endereco_bairro?: string;
  client_endereco_cidade?: string;
  client_endereco_uf?: string;
  client_endereco_cep?: string;
  
  // Dados da Venda
  plan_type?: PlanType;
  forma_pagamento?: string;
  periodicidade_cobranca?: string;
  valor_mensal?: number;
  energia_companhia?: string;
  pagamento_banco?: string;
  pagamento_agencia?: string;
  pagamento_conta?: string;
  pagamento_orgao?: string;
  pagamento_matricula?: string;
  has_dependents?: boolean;
  dependents?: string;
}

// Draft com dados parciais salvos
export interface SaleDraft {
  id: string;
  operator_id: string;
  client_id?: string;
  status: 'draft';
  current_step: number;
  form_data: Partial<SaleFormData>;
  plan_type?: PlanType;
  created_at: string;
  updated_at: string;
}

export interface SalesListFilter {
  status?: SaleStatus;
  plan_type?: PlanType;
  search?: string; // CPF ou nome do cliente
  date_from?: string;
  date_to?: string;
}
