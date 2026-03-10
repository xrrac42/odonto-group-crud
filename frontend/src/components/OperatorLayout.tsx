import React, { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import logo from '../../assets/logo-colorida.png';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { saleService } from '../services/saleService';

export default function OperatorLayout() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSale = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Criando draft para:', user.id);
      const draft = await saleService.createDraft(user.id);
      console.log('✅ Draft criado:', draft.id);
      
      navigate(`/sales/${draft.id}/step-1`, { replace: true });
    } catch (err) {
      console.error('❌ Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao iniciar venda');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'operator') {
    return <div className="text-center text-red-600 p-8">Acesso negado</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow h-40">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="OdontoGroup" className="h-60 p-0" />
          
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <User className="w-5 h-5 text-gray-600" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <span className="text-sm font-medium text-gray-700">{user.nome}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Iniciar Nova Venda
          </h2>
          <p className="text-gray-600 mb-6">
            Clique no botão abaixo para cadastrar um novo contrato de venda.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleStartSale}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Iniciando...' : '✨ Novo Contrato de Venda'}
          </button>
        </div>
      </div>
    </div>
  );
}
