import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuthContext } from '../contexts/AuthContext';
import { LogOut, FileSignature, CheckCircle2, User } from 'lucide-react';
import logo from '../../assets/logo-colorida.png';

interface SaleData {
  id: string;
  status: string;
  plan_type: string;
  client_id: string;
  docuseal_link: string;
}


export default function SignatureIsolatedPage() {
  const { saleId } = useParams<{ saleId: string }>();
  const navigate = useNavigate();
  const authContext = useAuthContext();

  const [sale, setSale] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Botão de copiar link - hook deve ficar no topo
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSaleData = async () => {
      if (!saleId) return;
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('sales')
          .select('id, status, plan_type, client_id, docuseal_link')
          .eq('id', saleId)
          .single();

        if (error || !data) {
          throw new Error('Venda não encontrada.');
        }

        console.log('Dados da venda carregados:', data);
        setSale(data as SaleData);
      } catch (err: any) {
        setError(err.message || 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    fetchSaleData();
  }, [saleId, (authContext as any)?.session?.access_token]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <p className="text-gray-600 animate-pulse font-medium">Carregando dados do contrato...</p>
    </div>;
  }

  if (error || !sale) {
    return <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-red-50 text-red-700 p-6 rounded-lg max-w-md text-center border border-red-200">
        <p className="font-bold text-lg mb-2">Ops! Ocorreu um problema</p>
        <p>{error || 'Venda não localizada'}</p>
        <button onClick={() => navigate('/sales')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Voltar para lista
        </button>
      </div>
    </div>;
  }


  // Status Stepper com ícones
  const renderStepper = () => {
    if (sale.status === 'awaiting_signature') {
      return (
        <div className="flex items-center justify-center gap-3 mb-6">
          <FileSignature className="w-6 h-6 text-blue-700" />
          <span className="font-semibold text-blue-700">Aguardando assinatura do cliente</span>
        </div>
      );
    }
    if (sale.status === 'signed' || sale.status === 'approved_manually') {
      return (
        <div className="flex items-center justify-center gap-3 mb-6">
          <CheckCircle2 className="w-6 h-6 text-green-700" />
          <span className="font-semibold text-green-700">Assinado! Aguardando aprovação do gestor</span>
        </div>
      );
    }
    return null;
  };

  // Botão de copiar link
  const handleCopy = () => {
    if (sale?.docuseal_link) {
      navigator.clipboard.writeText(sale.docuseal_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (sale.status === 'signed' || sale.status === 'approved_manually') {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-sm border border-green-200">
        <div className="flex items-center justify-between mb-6">
          <img src={logo} alt="Logo" className="h-16" />
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/sales')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Voltar para vendas
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              <LogOut className="w-5 h-5" /> Sair
            </button>
          </div>
        </div>
        {renderStepper()}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-green-700 mb-2">Contrato Assinado!</h2>
          <p className="text-gray-600 mb-6">O status desta venda no sistema é: <span className="font-bold uppercase">{sale.status}</span></p>
          <button onClick={() => navigate(`/sales/${sale.id}/step-4`)} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 w-full">
            Avançar para Conclusão
          </button>
        </div>
      </div>
    );
  }

  if (sale.status === 'awaiting_signature') {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <img src={logo} alt="Logo" className="h-16" />
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/sales')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Voltar para vendas
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              <LogOut className="w-5 h-5" /> Sair
            </button>
          </div>
        </div>
        {renderStepper()}
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><User className="w-6 h-6 text-blue-700" />Aguardando Assinatura do Cliente</h2>
        <p className="text-gray-600 mb-4">Envie o link abaixo para o cliente assinar o documento:</p>
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200 break-all mb-6 flex items-center gap-2">
          <a href={sale.docuseal_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex-1">
            {sale.docuseal_link}
          </a>
          <button
            onClick={handleCopy}
            className={`px-3 py-1 rounded text-white ${copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
        <div className="mb-4 text-sm text-gray-700 flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-blue-700" />
          <span>Envie este link ao cliente e aguarde a assinatura.</span>
        </div>
        <p className="text-sm text-gray-500">
          Assim que o cliente assinar, esta tela será atualizada automaticamente.<br/>
          (Você pode recarregar a página para atualizar o status.)
        </p>
      </div>
    );
  }

  return <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-sm">
    <h2 className="text-2xl font-bold text-yellow-700">Venda Incompleta</h2>
    <p>O status atual é: {sale.status}. Você precisa finalizar o cadastro do cliente antes de gerar o documento.</p>
    <p> Link: {sale.docuseal_link}</p>
  </div>;
}
