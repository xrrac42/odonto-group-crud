// components/sales/steps/StepSuccess.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import type { Sale, SaleFormData } from '../../../types';

interface StepSuccessProps {
  sale: Sale;
  formData?: SaleFormData;
  onCancelSale?: () => Promise<void>;
}

export default function StepSuccess({ sale, formData, onCancelSale }: StepSuccessProps) {
  const navigate = useNavigate();
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  // Log de lifecycle para debug
  useEffect(() => {
    console.log('✅ StepSuccess montado para venda:', sale.id);
    console.log('📊 Sale:', sale);
    console.log('📝 FormData:', formData);
    return () => {
      console.log('🔄 StepSuccess desmontado');
    };
  }, [sale.id]);

  // Usar dados do cliente do sale.client ou formData
  const clientNome = formData?.client_nome || (sale as any).client?.nome || 'N/A';
  const clientCpf = formData?.client_cpf || (sale as any).client?.cpf || 'N/A';
  const clientEmail = formData?.client_email || (sale as any).client?.email || 'N/A';
  const clientTelefone = formData?.client_telefone || (sale as any).client?.telefone || 'N/A';
  const planType = formData?.plan_type || sale.plan_type || 'N/A';

  const [newSaleLoading, setNewSaleLoading] = useState(false);

  const handleCancelSale = async () => {
    try {
      setCancelLoading(true);
      setCancelError(null);
      setCancelSuccess(null);

      if (onCancelSale) {
        await onCancelSale();
      }
      setCancelSuccess('Venda cancelada. Você pode iniciar um novo cadastro.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cancelar venda';
      setCancelError(message);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleNewSale = async () => {
    try {
      setNewSaleLoading(true);
      console.log('🆕 Criando nova venda...');
      
      // Importar saleService dinamicamente
      const { saleService } = await import('../../../services/saleService');
      
      // Criar draft - agora sem timeouts e Promise.race
      const draft = await saleService.createDraft(sale.operator_id);
      
      console.log('✅ Draft criado:', draft.id);
      
      // Navegar para o novo draft com replace para não voltar
      navigate(`/sales/${draft.id}/step-1`, { replace: true });
    } catch (err) {
      console.error('❌ Erro ao criar nova venda:', err);
      setCancelError(err instanceof Error ? err.message : 'Erro ao criar nova venda');
      setNewSaleLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Passo 4: Venda Concluída
      </h2>

      <div className="space-y-6">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-10 h-10 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900 mb-2">
                Venda registrada com sucesso!
              </p>
              <p className="text-green-800">
                O documento foi assinado digitalmente pelo cliente. A venda está
                agora aguardando aprovação final.
              </p>
            </div>
          </div>
        </div>

        {/* Resumo da Venda */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Resumo da Venda</h3>

          <div className="space-y-4">
            {/* Cliente */}
            <div className="border-b border-gray-200 pb-4">
              <p className="text-sm text-gray-600 mb-2">Cliente</p>
              <p className="font-semibold text-gray-900">{clientNome}</p>
              <p className="text-sm text-gray-700">CPF: {clientCpf}</p>
            </div>

            {/* Plano */}
            <div className="border-b border-gray-200 pb-4">
              <p className="text-sm text-gray-600 mb-2">Tipo de Plano</p>
              <p className="font-semibold text-gray-900">{planType}</p>
            </div>

            {/* Contato */}
            <div className="border-b border-gray-200 pb-4">
              <p className="text-sm text-gray-600 mb-2">Informações de Contato</p>
              <p className="text-sm text-gray-900">Email: {clientEmail}</p>
              <p className="text-sm text-gray-900">
                Telefone: {clientTelefone}
              </p>
            </div>

            {/* IDs */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Identificadores</p>
              <div className="space-y-2 text-xs font-mono text-gray-700">
                <p>ID Venda: {sale.id}</p>
                <p>
                  DocuSeal: {sale.docuseal_submission_id || 'Processando...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Próximas Ações */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">Próximas Etapas</h3>
          <ol className="space-y-3 text-sm text-blue-800">
            <li className="flex gap-3">
              <span className="font-semibold">1.</span>
              <span>
                A venda foi registrada e enviada para análise do administrador
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold">2.</span>
              <span>
                O administrador revisará e aprovará a venda na fase financeira
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold">3.</span>
              <span>
                Após aprovação, o cliente receberá confirmação por email
              </span>
            </li>
          </ol>
        </div>

        {/* Ações */}
        <div className="flex flex-col items-center gap-4 pt-6 border-t">
          {cancelError && (
            <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {cancelError}
            </div>
          )}
          {cancelSuccess && (
            <div className="w-full bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
              {cancelSuccess}
            </div>
          )}
          <button
            onClick={handleNewSale}
            disabled={newSaleLoading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {newSaleLoading ? '⏳ Criando...' : '✨ Nova Venda'}
          </button>
        </div>
      </div>
    </div>
  );
}
