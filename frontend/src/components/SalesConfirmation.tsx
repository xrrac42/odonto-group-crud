import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import StepSuccess from './sales/steps/StepSuccess';
import type { Sale, SaleFormData } from '../types';

export default function SalesConfirmation() {
  const { saleId } = useParams<{ saleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sale, setSale] = useState<Sale | null>(null);
  const [formData, setFormData] = useState<SaleFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !saleId) return;
    
    // Evitar loop: só carregar se ainda não temos os dados
    if (sale && formData) return;

    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      try {
        setError(null);
        setLoading(true);

        // Carregar dados da venda
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .select('*')
          .eq('id', saleId)
          .single();

        if (saleError || !saleData) {
          throw new Error(
            saleError?.message || 'Venda não encontrada'
          );
        }

        if (!isMounted) return;

        // Validar que a venda foi assinada
        if (saleData.status !== 'signed') {
          console.warn(
            '⚠️ Venda não foi assinada ainda. Status:',
            saleData.status
          );
          throw new Error(
            'Esta venda ainda não foi assinada. Aguarde a assinatura do cliente.'
          );
        }

        // Carregar dados do cliente
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', saleData.client_id)
          .single();

        if (clientError || !clientData) {
          console.error('Erro ao carregar dados do cliente:', clientError);
          throw new Error('Erro ao carregar dados do cliente');
        }

        if (!isMounted) return;

        // Montar formData a partir dos dados salvos
        const formattedData: SaleFormData = {
          client_nome: clientData.nome,
          client_cpf: clientData.cpf,
          client_data_nascimento: clientData.data_nascimento,
          client_nome_mae: clientData.nome_mae,
          client_endereco_completo: clientData.endereco_completo,
          client_email: clientData.email,
          client_telefone: clientData.telefone,
          plan_type: saleData.plan_type,
        };

        setSale(saleData);
        setFormData(formattedData);
      } catch (err) {
        if (!isMounted || controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'Erro ao carregar dados';
        setError(message);
        console.error('❌ Erro em SalesConfirmation:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [user, saleId, sale, formData]); // Adicionado sale e formData como dependências

  if (!user) {
    return <div>Você não está autenticado</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando dados da venda...</p>
        </div>
      </div>
    );
  }

  // Se houver erro, mostrar mensagem com opções de recuperação
  if (error || !sale || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Erro ao carregar confirmação
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'Não conseguimos carregar os dados dessa venda'}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/sales')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Voltar para Vendas
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Recarregar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar o stepper no step 4 (confirmação)
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Confirmação da Venda
          </h1>

          {/* Indicador de Progresso - Completo */}
          <div className="flex items-center justify-between">
            {[
              { step: 1 },
              { step: 2 },
              { step: 3 },
              { step: 4 },
            ].map(({ step }) => (
              <React.Fragment key={step}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step <= 4 ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                {step < 4 && (
                  <div className="flex-1 h-1 mx-2 bg-green-600" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Labels */}
          <div className="flex justify-between mt-4 text-sm text-gray-600">
            <span>Validação</span>
            <span>Dados</span>
            <span>Assinatura</span>
            <span>Confirmação</span>
          </div>
        </div>

        {/* Conteúdo - Renderizar Step 4 */}
        <div className="bg-white rounded-lg shadow">
          <StepSuccess
            sale={sale}
            formData={formData}
          />
        </div>
      </div>
    </div>
  );
}
