import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import SalesFlowStepper from './sales/SalesFlowStepper';
import type { Sale } from '../types';

type SalesStep = 1 | 2 | 3 | 4;

interface SalesDetailProps {
  initialStep?: SalesStep;
}

export default function SalesDetail({ initialStep }: SalesDetailProps) {
  const { saleId } = useParams<{ saleId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!saleId || !user) return;

    const loadSale = async () => {
      try {
        setLoading(true);
        console.log('🔍 Carregando venda:', saleId);
        const { data, error: queryError } = await supabase
          .from('sales')
          .select('*, client:clients(*)')
          .eq('id', saleId)
          .single();

        if (queryError || !data) {
          console.error('❌ Erro ao carregar venda:', queryError);
          throw new Error('Venda não encontrada');
        }

        console.log('✅ Venda carregada com client:', data);
        setSale(data as Sale);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar venda';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadSale();
  }, [saleId, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando venda...</p>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <p className="text-red-600 font-semibold mb-4">{error || 'Venda não encontrada'}</p>
          <button
            onClick={() => navigate('/sales')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Voltar para Vendas
          </button>
        </div>
      </div>
    );
  }

  return <SalesFlowStepper initialSale={sale} saleId={saleId} initialStep={initialStep} />;
}
