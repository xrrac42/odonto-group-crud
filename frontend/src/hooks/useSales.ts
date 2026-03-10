// hooks/useSales.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Sale, SaleWithClient, SalesListFilter } from '../types';

export function useSales(filter?: SalesListFilter) {
  const [sales, setSales] = useState<SaleWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSales = async () => {
    try {
      console.log('📊 useSales: Iniciando loadSales com filtro:', filter);
      setLoading(true);
      setError(null);

      let query = supabase
        .from('sales')
        .select('*, client:clients(*)')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filter?.status) {
        console.log('🔍 Aplicando filtro de status:', filter.status);
        query = query.eq('status', filter.status);
      }

      if (filter?.plan_type) {
        console.log('🔍 Aplicando filtro de plano:', filter.plan_type);
        query = query.eq('plan_type', filter.plan_type);
      }

      console.log('📡 Executando query...');
      const { data, error: queryError } = await query;

      if (queryError) {
        console.error('❌ Erro na query:', queryError);
        throw queryError;
      }

      console.log('✅ Vendas carregadas:', data?.length || 0);
      setSales((data || []) as SaleWithClient[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar vendas';
      console.error('❌ Error loading sales:', err);
      setError(message);
    } finally {
      console.log('🏁 loadSales finalizado, setLoading(false)');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect disparado, filter mudou:', filter);
    loadSales();
    
    // Configurar realtime subscription para mudanças
    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
        },
        () => {
          // Recarregar vendas quando houver mudanças
          console.log('🔔 Realtime: Mudança detectada, recarregando...');
          loadSales();
        }
      )
      .subscribe();

    return () => {
      console.log('🧹 Limpando subscription');
      channel.unsubscribe();
    };
  }, [filter?.status, filter?.plan_type]);

  return { sales, loading, error, refetch: loadSales };
}

// Hook para acompanhar uma venda específica em tempo real
export function useSaleRealtime(saleId: string | null) {
  const [sale, setSale] = useState<SaleWithClient | null>(null);
  const [loading, setLoading] = useState(!!saleId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!saleId) {
      setSale(null);
      return;
    }

    loadSale();

    // Configurar realtime subscription
    const channel = supabase
      .channel(`sale-${saleId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sales',
          filter: `id=eq.${saleId}`,
        },
        () => {
          loadSale();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [saleId]);

  const loadSale = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('sales')
        .select('*, client:clients(*)')
        .eq('id', saleId)
        .single();

      if (queryError) throw queryError;

      setSale(data as SaleWithClient);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar venda';
      setError(message);
      console.error('Error loading sale:', err);
    } finally {
      setLoading(false);
    }
  };

  return { sale, loading, error };
}
