// components/sales/SalesFlowStepper.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ClipboardCheck, User, FileSignature, CheckCircle2, Home, LogOut } from 'lucide-react';
import logo from '../../../assets/logo-colorida.png';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { saleService } from '../../services/saleService';
import type { SaleFormData, Sale } from '../../types';
import StepValidation from './steps/StepValidation';
import StepClientData from './steps/StepClientData';
import StepAwaitingSignature from './steps/StepAwaitingSignature';
import StepSuccess from './steps/StepSuccess';

type SalesStep = 1 | 2 | 3 | 4;

interface SalesFlowStepperProps {
  initialSale?: Sale;
  saleId?: string;
  initialStep?: SalesStep;
}

export default function SalesFlowStepper({ initialSale, saleId: propSaleId, initialStep }: SalesFlowStepperProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { saleId: paramSaleId } = useParams<{ saleId: string }>();

  const saleId = paramSaleId || propSaleId;

  const getStepFromUrl = (): SalesStep => {
    const path = location.pathname;
    if (path.includes('step-1')) return 1;
    if (path.includes('step-2')) return 2;
    if (path.includes('step-3')) return 3;
    if (path.includes('step-4')) return 4;
    return initialStep || (initialSale ? 3 : 1);
  };

  const [currentStep, setCurrentStep] = useState<SalesStep>(getStepFromUrl());
  const [formData, setFormData] = useState<Partial<SaleFormData>>({});
  const [sale, setSale] = useState<Sale | null>(initialSale || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docuSealLink, setDocuSealLink] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // 🔑 Garante que o envelope só é criado UMA vez, independente de re-renders
  const envelopeCreatedRef = useRef(false);

  // Sincronizar URL com currentStep
  useEffect(() => {
    setCurrentStep(getStepFromUrl());
  }, [location.pathname]);

  useEffect(() => {
    console.log('🔄 SalesFlowStepper - Step:', currentStep, 'saleId:', saleId);
  }, [currentStep, saleId]);

  // Se initialSale foi passado, carregar docuseal_link do banco
  useEffect(() => {
    if (!initialSale || !saleId) return;

    const loadDocuSealLink = async () => {
      try {
        console.log('🔗 Carregando docuseal_link para initialSale:', saleId);
        setIsRecovering(true);

        const { data } = await supabase
          .from('sales')
          .select('docuseal_link')
          .eq('id', saleId)
          .single();

        if (data?.docuseal_link) {
          console.log('✅ DocuSeal link encontrado:', data.docuseal_link);
          setDocuSealLink(data.docuseal_link);
        }
      } catch (err) {
        console.error('❌ Erro ao carregar docuseal_link:', err);
      } finally {
        setIsRecovering(false);
      }
    };

    loadDocuSealLink();
  }, []); // 🔑 array vazio — roda só na montagem, initialSale não muda

  // Recuperar draft da URL se existir
  useEffect(() => {
    if (!saleId || initialSale) return;

    const loadDraft = async () => {
      try {
        console.log('📥 Carregando draft:', saleId);
        setIsRecovering(true);
        setLoading(true);
        const draft = await saleService.getDraft(saleId);

        if (draft) {
          console.log('✅ Draft carregado:', draft);
          setSale(draft);

          if (draft.status === 'signed' && !window.location.pathname.includes('step-4')) {
            console.log('✅ Venda já está signed, redirecionando para step-4');
            navigate(`/sales/${saleId}/step-4`, { replace: true });
            return;
          }

          if (draft.docuseal_link) {
            console.log('📄 DocuSeal link encontrado:', draft.docuseal_link);
            setDocuSealLink(draft.docuseal_link);
          }

          if (draft.client_id) {
            console.log('👤 Carregando dados do cliente:', draft.client_id);

            const { data: client } = await supabase
              .from('clients')
              .select('*')
              .eq('id', draft.client_id)
              .single();

            if (client) {
              console.log('✅ Cliente carregado:', client.nome);
              setFormData({
                client_nome: client.nome,
                client_cpf: client.cpf,
                client_data_nascimento: client.data_nascimento,
                client_nome_mae: client.nome_mae,
                client_endereco_completo: client.endereco_completo,
                client_email: client.email,
                client_telefone: client.telefone,
                client_matricula_origem: client.matricula_origem,
                client_orgao_origem: client.orgao_origem,
                client_rg: client.rg,
                client_orgao_expedidor: client.orgao_expedidor,
                client_sexo: client.sexo,
                client_estado_civil: client.estado_civil,
                client_nome_social: client.nome_social,
                client_endereco_logradouro: client.endereco_logradouro,
                client_endereco_numero: client.endereco_numero,
                client_endereco_complemento: client.endereco_complemento,
                client_endereco_bairro: client.endereco_bairro,
                client_endereco_cidade: client.endereco_cidade,
                client_endereco_uf: client.endereco_uf,
                client_endereco_cep: client.endereco_cep,
                client_unidade_consumo: draft.unidade_consumo,
                energia_companhia: draft.energia_companhia,
                pagamento_banco: draft.pagamento_banco,
                pagamento_agencia: draft.pagamento_agencia,
                pagamento_conta: draft.pagamento_conta,
                pagamento_orgao: draft.pagamento_orgao,
                pagamento_matricula: draft.pagamento_matricula,
                has_dependents: draft.has_dependents,
                dependents: draft.dependents,
                forma_pagamento: draft.forma_pagamento,
                valor_mensal: draft.valor_mensal,
                plan_type: draft.plan_type,
              });
            }
          }
        } else {
          console.error('❌ Draft não encontrado');
          setError('Venda não encontrada');
        }
      } catch (err) {
        console.error('❌ Error loading draft:', err);
        setError('Erro ao carregar rascunho');
      } finally {
        setLoading(false);
        setIsRecovering(false);
      }
    };

    loadDraft();
  }, [saleId]); // 🔑 só saleId — initialSale é estável e não precisa estar aqui

  // 🔑 Criar envelope — sem sale.* nas dependências para não re-executar quando o webhook atualiza o banco
  useEffect(() => {
    console.log('🔄 useEffect envelope - Checando condições:', {
      currentStep,
      hasSale: !!sale,
      saleId,
      isRecovering,
      saleStatus: sale?.status,
      hasDocuSealLink: !!docuSealLink,
      envelopeCreated: envelopeCreatedRef.current,
    });

    if (!user) return;
    if (currentStep !== 3 || !sale || !saleId) return;
    if (isRecovering) return;
    if (sale.status === 'signed') return;
    if (envelopeCreatedRef.current) return; // 🔑 nunca roda duas vezes

    if (sale.docuseal_link) {
      console.log('📦 Usando docuseal_link já existente do sale:', sale.docuseal_link);
      setDocuSealLink(sale.docuseal_link);
      setLoading(false);
      return;
    }

    if (docuSealLink) {
      console.log('📦 docuSealLink já existe no state local');
      setLoading(false);
      return;
    }

    envelopeCreatedRef.current = true; // 🔑 marca ANTES do async para evitar duplo disparo em StrictMode

    const prepareEnvelope = async () => {
      try {
        setLoading(true);

        console.log('🔍 Verificando no banco se já existe envelope...');
        const { data: freshSale, error: fetchError } = await supabase
          .from('sales')
          .select('docuseal_link, status, client_id')
          .eq('id', saleId)
          .single();

        if (fetchError || !freshSale) {
          console.error('❌ Erro ao verificar venda:', fetchError);
          envelopeCreatedRef.current = false;
          setLoading(false);
          return;
        }

        if (freshSale.docuseal_link) {
          console.log('✅ Link JÁ EXISTE no banco:', freshSale.docuseal_link);
          setDocuSealLink(freshSale.docuseal_link);
          setLoading(false);
          return;
        }

        if (!freshSale.client_id) {
          console.error('❌ Sale não tem client_id vinculado');
          envelopeCreatedRef.current = false;
          setError('Cliente não vinculado. Volte ao passo 2.');
          setLoading(false);
          return;
        }

        console.log('🚀 Criando NOVO envelope (não existe no banco)...');

        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', freshSale.client_id)
          .single();

        if (clientError || !clientData) {
          console.error('❌ Erro ao buscar cliente:', clientError);
          envelopeCreatedRef.current = false;
          throw new Error('Cliente não encontrado para gerar contrato.');
        }

        const envelope = await saleService.createEnvelope(
          saleId,
          clientData,
          { 
            plan_type: sale.plan_type,
            forma_pagamento: sale.forma_pagamento,
            periodicidade_cobranca: sale.periodicidade_cobranca,
            valor_mensal: sale.valor_mensal
          },
          user.id
        );

        // 🔑 Sem isMounted — se o componente desmontou mas o envelope foi criado,
        // o React vai ignorar o setState silenciosamente. Não causa erro.
        console.log('✅ Envelope criado:', envelope.docuSealLink);
        setDocuSealLink(envelope.docuSealLink);

      } catch (err) {
        envelopeCreatedRef.current = false;
        console.error('Erro na preparação do envelope:', err);
        setError(err instanceof Error ? err.message : 'Erro ao gerar contrato');
      } finally {
        setLoading(false);
      }
    };

    prepareEnvelope();
  }, [currentStep, saleId, isRecovering, user?.id]); // 🔑 sem docuSealLink, sem sale.*

  const resetFlow = () => navigate('/sales');

  if (!user) return <div>Você não está autenticado</div>;

  const handleStepValidation = () => {
    if (saleId) {
      navigate(`/sales/${saleId}/step-2`);
      setCurrentStep(2);
    } else {
      setCurrentStep(2);
    }
  };

  const handleStepClientDataSubmit = async (data: SaleFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (
        !data.client_nome ||
        !data.client_cpf ||
        !data.client_data_nascimento ||
        !data.client_nome_mae ||
        !data.client_endereco_completo ||
        !data.client_email ||
        !data.client_telefone ||
        !data.forma_pagamento ||
        !data.plan_type
      ) {
        throw new Error('Todos os campos obrigatórios devem ser preenchidos');
      }

      if (data.forma_pagamento === 'conta_energia') {
        if (!data.client_unidade_consumo) {
          throw new Error('Unidade de consumo é obrigatória para Conta de Energia');
        }
        if (!data.energia_companhia) {
          throw new Error('Companhia de energia é obrigatória para Conta de Energia');
        }
      }

      if (data.forma_pagamento === 'pix_automatico') {
        if (!data.pagamento_banco || !data.pagamento_agencia || !data.pagamento_conta) {
          throw new Error('Banco, agência e conta são obrigatórios para PIX Automático');
        }
      }

      if (data.forma_pagamento === 'debito_conta') {
        if (!data.pagamento_agencia || !data.pagamento_conta) {
          throw new Error('Agência e conta são obrigatórios para Débito em Conta');
        }
      }

      if (data.forma_pagamento === 'desconto_folha') {
        if (!data.pagamento_orgao || !data.pagamento_matricula) {
          throw new Error('Órgão e matrícula são obrigatórios para Desconto em Folha');
        }
      }

      setFormData(data);

      let updatedSale: Sale;

      if (saleId) {
        updatedSale = await saleService.linkClientToDraft(saleId, data);
      } else {
        updatedSale = await saleService.createSale(data, user.id);
      }

      setSale(updatedSale);

      // Gerar envelope/docuseal_link imediatamente após cadastro do cliente
      // Regra: só avança após link ser criado e persistido pela edge function
      const { data: fullClientData, error: fullClientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', updatedSale.client_id)
        .single();

      if (fullClientError || !fullClientData) {
        throw new Error('Não foi possível carregar os dados do cliente para gerar o contrato.');
      }

      const envelope = await saleService.createEnvelope(
        updatedSale.id,
        fullClientData,
        {
          plan_type: data.plan_type!,
          forma_pagamento: data.forma_pagamento,
          periodicidade_cobranca: 'mensal',
          valor_mensal: data.valor_mensal,
          unidade_consumo: data.client_unidade_consumo,
          energia_companhia: data.energia_companhia,
          pagamento_banco: data.pagamento_banco,
          pagamento_agencia: data.pagamento_agencia,
          pagamento_conta: data.pagamento_conta,
          pagamento_orgao: data.pagamento_orgao,
          pagamento_matricula: data.pagamento_matricula,
          has_dependents: data.has_dependents,
          dependents: data.dependents,
        },
        user.id
      );
      setDocuSealLink(envelope.docuSealLink);

      navigate(`/signature/${updatedSale.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar venda';
      setError(message);
      console.error('Error creating sale:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSale = async () => {
    if (!sale) return;
    await saleService.updateSaleStatus(sale.id, 'draft');
    resetFlow();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <img src={logo} alt="Logo" className="h-40 w-50" />
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/sales')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 inline-flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Início
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('supabase.auth.token');
                  window.location.href = '/login';
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Novo Contrato de Venda
          </h1>

          {/* Indicador de Progresso */}
          <div className="flex items-center justify-between">
            {[
              { step: 1, icon: ClipboardCheck },
              { step: 2, icon: User },
              { step: 3, icon: FileSignature },
              { step: 4, icon: CheckCircle2 },
            ].map(({ step, icon: Icon }) => (
              <React.Fragment key={step}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step === currentStep
                      ? 'bg-blue-600 text-white'
                      : step < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex justify-between mt-4 text-sm text-gray-600">
            <span>Validação</span>
            <span>Dados</span>
            <span>Assinatura</span>
            <span>Confirmação</span>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button
              type="button"
              onClick={resetFlow}
              className="mt-3 inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Novo cadastro
            </button>
          </div>
        )}

        {/* Conteúdo do Passo */}
        <div className="bg-white rounded-lg shadow">
          {currentStep === 1 && (
            <StepValidation user={user} onNext={handleStepValidation} />
          )}

          {currentStep === 2 && (
            <StepClientData
              onSubmit={handleStepClientDataSubmit}
              loading={loading}
              onBack={() => {
                if (saleId) navigate(`/sales/${saleId}/step-1`);
                setCurrentStep(1);
              }}
              initialData={formData}
            />
          )}

          {currentStep === 3 && sale && (
            docuSealLink ? (
              <StepAwaitingSignature
                sale={sale}
                docuSealLink={docuSealLink}
                onCancelSale={handleCancelSale}
                saleId={saleId || sale.id}
              />
            ) : error ? (
              <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg">
                <p className="font-semibold mb-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
                <p className="text-gray-600">
                  {isRecovering ? 'Recuperando dados da venda...' : 'Gerando/Carregando link de assinatura...'}
                </p>
              </div>
            )
          )}

          {currentStep === 4 && sale && (
            <StepSuccess
              sale={sale}
              formData={formData as SaleFormData}
              onCancelSale={handleCancelSale}
            />
          )}
        </div>
      </div>
    </div>
  );
}