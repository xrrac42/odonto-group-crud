// components/sales/NewSaleStarter.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { saleService } from '../../services/saleService';

export default function NewSaleStarter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCreatingRef = useRef(false);

  // Resetar flag quando componente remonta
  useEffect(() => {
    console.log('🔄 NewSaleStarter montado, resetando flag');
    isCreatingRef.current = false;
    setLoading(false);
    setError(null);
    
    return () => {
      console.log('🧹 NewSaleStarter desmontado');
      isCreatingRef.current = false;
    };
  }, []);

  const handleStartNewSale = async () => {
    if (!user) {
      console.error('❌ Usuário não autenticado');
      return;
    }
    
    // Prevenir múltiplas chamadas simultâneas
    if (isCreatingRef.current || loading) {
      console.log('⚠️ Já existe uma criação em andamento, ignorando...');
      return;
    }

    // Timeout de segurança de 10 segundos
    const timeoutId = setTimeout(() => {
      console.error('⏰ Timeout: Criação demorou mais de 10 segundos');
      setError('Timeout ao criar venda. Tente novamente.');
      setLoading(false);
      isCreatingRef.current = false;
    }, 10000);

    try {
      isCreatingRef.current = true;
      setLoading(true);
      setError(null);

      console.log('🚀 Criando novo draft para operador:', user.id);

      // Aguardar 500ms para garantir que componentes anteriores foram desmontados
      console.log('⏳ Aguardando cleanup de componentes anteriores...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔄 Iniciando criação do draft...');

      // Criar draft com timeout forçado usando Promise.race
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: createDraft demorou mais de 8 segundos')), 8000);
      });

      const draft = await Promise.race([
        saleService.createDraft(user.id),
        timeoutPromise
      ]);

      console.log('✅ Draft criado com sucesso:', draft.id);
      
      // Limpar timeout
      clearTimeout(timeoutId);

      // Redirecionar imediatamente
      console.log('🔀 Navegando para step-1...');
      navigate(`/sales/${draft.id}/step-1`, { replace: true });
      
    } catch (err) {
      clearTimeout(timeoutId);
      const message = err instanceof Error ? err.message : 'Erro ao iniciar venda';
      setError(message);
      console.error('❌ Error creating draft:', err);
      isCreatingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <ShoppingCart className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sistema de Vendas
          </h1>
          <p className="text-gray-600">
            Bem-vindo, {user?.nome}! Clique abaixo para iniciar um novo contrato.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleStartNewSale}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Iniciando...</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>Novo Contrato de Venda</span>
            </>
          )}
        </button>

        <p className="mt-4 text-xs text-gray-500">
          Um rascunho será criado e salvo automaticamente durante o processo
        </p>
      </div>
    </div>
  );
}
