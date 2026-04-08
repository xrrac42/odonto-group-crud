import { useEffect, useState, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, BACKEND_URL, getUserJWT, clearJWTCache } from '../lib/supabaseClient';
import { LogOut, FileSignature, CheckCircle2, User } from 'lucide-react';

// Cache simples em memória (production usaria Redis/SWR)
const saleCache = new Map<string, { data: SaleData; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 segundos

interface SaleData {
  id: string;
  status: string;
  plan_type: string;
  client_id: string;
  docuseal_link: string;
}

// Componente memoizado para o stepper
const StatusStepper = memo(({ status }: { status: string }) => {
  if (status === 'awaiting_signature') {
    return (
      <div className="flex items-center justify-center gap-3 mb-6">
        <FileSignature className="w-6 h-6 text-blue-700" />
      </div>
    );
  }
  if (status === 'signed' || status === 'approved_manually') {
    return (
      <div className="flex items-center justify-center gap-3 mb-6">
        <CheckCircle2 className="w-6 h-6 text-green-700" />
        <span className="font-semibold text-green-700">Assinado! Aguardando aprovação do gestor</span>
      </div>
    );
  }
  return null;
});

StatusStepper.displayName = 'StatusStepper';

// Componente memoizado para header
const PageHeader = memo(({ onNavigate, onSignOut }: { onNavigate: () => void; onSignOut: () => void }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="h-16 flex items-center text-xl font-bold text-blue-600">
      [Logo]
    </div>
    <div className="flex gap-2">
      <button
        onClick={onNavigate}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
      >
        Voltar para vendas
      </button>
      <button
        onClick={onSignOut}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        <LogOut className="w-5 h-5" /> Sair
      </button>
    </div>
  </div>
));

PageHeader.displayName = 'PageHeader';

// Componente memoizado para erro
const ErrorView = memo(({ error, onNavigate }: { error: string; onNavigate: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
    <div className="bg-red-50 text-red-700 p-6 rounded-lg max-w-md text-center border border-red-200">
      <p className="font-bold text-lg mb-2">Ops! Ocorreu um problema</p>
      <p>{error}</p>
      <button
        onClick={onNavigate}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Voltar para lista
      </button>
    </div>
  </div>
));

ErrorView.displayName = 'ErrorView';

// Componente memoizado para loading
const LoadingView = memo(() => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Carregando dados do contrato...</p>
    </div>
  </div>
));

LoadingView.displayName = 'LoadingView';

// Componente memoizado para assinado
const SignedView = memo(
  ({ sale, onNavigate, onSignOut }: { sale: SaleData; onNavigate: () => void; onSignOut: () => void }) => (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-sm border border-green-200">
      <PageHeader onNavigate={onNavigate} onSignOut={onSignOut} />
      <StatusStepper status={sale.status} />
      <div className="text-center">
        <h2 className="text-3xl font-bold text-green-700 mb-2">Contrato Assinado!</h2>
        <p className="text-gray-600 mb-6">
          O status desta venda no sistema é: <span className="font-bold uppercase">{sale.status}</span>
        </p>
        <button
          onClick={() => window.location.href = `/sales/${sale.id}/step-4`}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors w-full"
        >
          Avançar para Conclusão
        </button>
      </div>
    </div>
  )
);

SignedView.displayName = 'SignedView';

// Componente memoizado para aguardando assinatura
const AwaitingSignatureView = memo(
  ({ sale, onNavigate, onSignOut, copied, onCopy, onRefresh }: { sale: SaleData; onNavigate: () => void; onSignOut: () => void; copied: boolean; onCopy: () => void; onRefresh: () => void }) => (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-sm">
      <PageHeader onNavigate={onNavigate} onSignOut={onSignOut} />
      <StatusStepper status={sale.status} />
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <User className="w-6 h-6 text-blue-700" />
        Aguardando Assinatura do Cliente
      </h2>
      <p className="text-gray-600 mb-4">Envie o link abaixo para o cliente assinar o documento:</p>
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200 break-all mb-6 flex items-center gap-2">
        <a href={sale.docuseal_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex-1">
          {sale.docuseal_link}
        </a>
        <button
          onClick={onCopy}
          className={`px-3 py-1 rounded text-white transition-colors whitespace-nowrap ${
            copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <div className="mb-4 text-sm text-gray-700 flex items-center gap-2">
        <FileSignature className="w-4 h-4 text-blue-700" />
        <span>Envie este link ao cliente e aguarde a assinatura.</span>
      </div>
      <div className="flex gap-2 mt-6">
        <button
          onClick={onRefresh}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold"
        >
           Verificar Assinatura
        </button>
      </div>
      <p className="text-sm text-gray-500 mt-4">
        Clique em "Verificar Assinatura" para atualizar o status quando o cliente terminar de assinar.

      </p>
    </div>
  )
);

AwaitingSignatureView.displayName = 'AwaitingSignatureView';

export default function SignatureIsolatedPage() {
  const { saleId } = useParams<{ saleId: string }>();
  const navigate = useNavigate();

  const [sale, setSale] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ✅ Função de fetch (pode ser chamada diretamente)
  const fetchSaleData = async (skipCache: boolean = false) => {
    if (!saleId) {
      setLoading(false);
      return;
    }

    try {
      // Verificar cache primeiro (30s) - a menos que seja skip
      if (!skipCache) {
        const cached = saleCache.get(saleId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log('✅ Cache hit:', saleId);
          setSale(cached.data);
          setLoading(false);
          return;
        }
      }

      console.log('🔄 Iniciando fetch sem cache...');
      setLoading(true);
      setError(null);

      // Obter JWT token para autenticação
      console.log('🔑 Obtendo JWT...');
      const jwt = await getUserJWT();
      console.log('🔑 JWT retornou:', jwt ? 'SIM ✅' : 'NÃO ❌');
      if (!jwt) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      console.log('🔄 Carregando venda completa do backend:', saleId);
      console.log('🔐 Token:', jwt.substring(0, 20) + '...');
      console.log('🌐 URL:', `${BACKEND_URL}/api/sales/${saleId}`);
      
      console.log('🚀 Iniciando fetch...');
      const response = await fetch(`${BACKEND_URL}/api/sales/${saleId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
      });
      console.log('✅ Fetch respondeu, status:', response.status);

      if (!response.ok) {
        console.error('❌ Response not ok, status:', response.status);
        throw new Error(`Erro ao verificar assinatura: ${response.status}`);
      }

      console.log('📄 Parsing JSON...');
      const data = await response.json();
      console.log('📄 JSON parsed com sucesso');

      console.log('📦 Resposta bruta do backend:', data);

      // ✅ Se é um objeto sale (tem id), usar diretamente
      if (data && data.id && data.status) {
        console.log('📊 Sale object recebido:', data);
        console.log('📊 Status:', data.status);
        console.log('📊 DocuSeal Link:', data.docuseal_link ? 'SIM ✅' : 'NÃO ❌');
        console.log('🔍 ESTRUTURA COMPLETA DO SALE:', JSON.stringify(data, null, 2));

        const saleData = data as SaleData;
        saleCache.set(saleId, { data: saleData, timestamp: Date.now() });
        setSale(saleData);
        setLoading(false);
        setError(null);

        console.log('✅ Dados carregados:', saleData);
        return;
      }

      // ✅ Fallback: se está em um wrapper { sale: {...} }
      if (data.sale && data.sale.id && data.sale.status) {
        console.log('📊 Sale object dentro de wrapper:', data.sale);
        const saleData = data.sale;
        saleCache.set(saleId, { data: saleData, timestamp: Date.now() });
        setSale(saleData);
        setLoading(false);
        setError(null);
        return;
      }

      // ❌ Outro erro
      throw new Error(data.message || data.error || 'Venda não encontrada.');
    } catch (err: any) {
      console.error('❌ Erro ao buscar venda:', err);
      setError(err.message || 'Erro desconhecido');
      setLoading(false);
    }
  };

  // Memoizar callbacks para evitar recriação
  const handleNavigate = useCallback(() => {
    navigate('/sales');
  }, [navigate]);

  const handleSignOut = useCallback(async () => {
    clearJWTCache();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }, []);

  const handleCopy = useCallback(() => {
    if (sale?.docuseal_link) {
      navigator.clipboard.writeText(sale.docuseal_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [sale?.docuseal_link]);

  // ✅ Função para recarregar os dados (limpar cache + nova requisição)
  const handleRefresh = useCallback(() => {
    console.log('🔄 handleRefresh CLICADO!');
    console.log('🔄 saleId:', saleId);
    console.log('🔄 fetchSaleData tipo:', typeof fetchSaleData);
    if (saleId) {
      console.log('🔄 Limpando cache para:', saleId);
      saleCache.delete(saleId);
      console.log('🔄 Chamando fetchSaleData(true)...');
      fetchSaleData(true).then(() => {
        console.log('✅ fetchSaleData completed!');
      }).catch((err) => {
        console.error('❌ fetchSaleData error:', err);
      });
    }
  }, [saleId]);

  // ÚNICA data fetch: usando BACKEND endpoint (não Supabase direto)
  useEffect(() => {
    fetchSaleData(false); // skipCache = false no primeiro carregamento
  }, [saleId]); // ✅ Só saleId

  if (loading) {
    return <LoadingView />;
  }

  if (error || !sale) {
    return <ErrorView error={error || 'Venda não localizada'} onNavigate={handleNavigate} />;
  }

  if (sale.status === 'signed' || sale.status === 'approved_manually') {
    return <SignedView sale={sale} onNavigate={handleNavigate} onSignOut={handleSignOut} />;
  }

  if (sale.status === 'awaiting_signature') {
    return (
      <AwaitingSignatureView
        sale={sale}
        onNavigate={handleNavigate}
        onSignOut={handleSignOut}
        copied={copied}
        onCopy={handleCopy}
        onRefresh={handleRefresh}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-yellow-700">Venda Incompleta</h2>
      <p>O status atual é: {sale.status}. Você precisa finalizar o cadastro do cliente antes de gerar o documento.</p>
      <p>Link: {sale.docuseal_link}</p>
    </div>
  );
}
