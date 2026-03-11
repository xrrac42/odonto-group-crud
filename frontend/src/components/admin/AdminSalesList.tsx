// components/admin/AdminSalesList.tsx
import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Check } from 'lucide-react';
import { saleService } from '../../services/saleService';
import type { SaleWithClient } from '../../types';
import * as XLSX from 'xlsx';

interface AdminSalesListProps {
  sales: SaleWithClient[];
  loading: boolean;
  error: string | null;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
}

export default function AdminSalesList({
  sales,
  loading,
  error,
  statusFilter,
  onStatusFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: AdminSalesListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!sales?.length) {
      console.log('🧪 AdminSalesList payload: lista vazia');
      return;
    }

    console.log('🧪 AdminSalesList payload (sales):', sales);
    console.log('🧪 Primeiro item da tabela:', sales[0]);
    console.log('🧪 Campo operator do primeiro item:', sales[0]?.operator);
  }, [sales]);

  const handleApproveSale = async (saleId: string) => {
    try {
      setActionLoading(saleId);
      setActionError(null);
      await saleService.approveSale(saleId);
      setActionSuccess(`Venda ${saleId.substring(0, 8)} aprovada com sucesso!`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao aprovar venda';
      setActionError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSale = async (saleId: string) => {
    try {
      setActionLoading(saleId);
      setActionError(null);
      await saleService.rejectSale(saleId);
      setActionSuccess(`Venda ${saleId.substring(0, 8)} rejeitada.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao rejeitar venda';
      setActionError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const getExportRows = () =>
    sales.map((sale) => ({
      ID: sale.id,
      Cliente: sale.client?.nome || '',
      CPF: sale.client?.cpf || '',
      Operador: sale.operator?.nome || 'N/A',
      Plano: sale.plan_type,
      Status: sale.status,
      Data: new Date(sale.created_at).toLocaleString('pt-BR'),
      Email: sale.client?.email || '',
      Telefone: sale.client?.telefone || '',
    }));

  const handleExportCSV = () => {
    const rows = getExportRows();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `vendas-admin-${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const rows = getExportRows();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas');
    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `vendas-admin-${timestamp}.xlsx`);
  };

  if (loading) {
    return <div className="text-center py-12">Carregando vendas...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Erro: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <button
            onClick={() => onStatusFilterChange('')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => onStatusFilterChange('signed')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'signed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Assinadas
          </button>
          <button
            onClick={() => onStatusFilterChange('approved_manually')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'approved_manually'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Aprovadas
          </button>
          <button
            onClick={() => onStatusFilterChange('awaiting_signature')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === 'awaiting_signature'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Aguardando Assinatura
          </button>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Data inicial</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Data final</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            onClick={() => {
              onStatusFilterChange('');
              onDateFromChange('');
              onDateToChange('');
            }}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Limpar filtros
          </button>

          <button
            onClick={handleExportCSV}
            disabled={sales.length === 0}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Exportar CSV
          </button>

          <button
            onClick={handleExportExcel}
            disabled={sales.length === 0}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Mensagens */}
      {actionSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {actionError}
        </div>
      )}

      {/* Tabela */}
      {sales.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-600">Nenhuma venda encontrada com os filtros aplicados</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Operador
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Plano
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">
                          {sale.client?.nome}
                        </p>
                        <p className="text-gray-600 text-xs">
                          {sale.client?.cpf}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {sale.operator?.nome || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {sale.plan_type}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          sale.status === 'approved_manually'
                            ? 'bg-green-100 text-green-800'
                            : sale.status === 'signed'
                            ? 'bg-blue-100 text-blue-800'
                            : sale.status === 'awaiting_signature'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {sale.status === 'signed' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveSale(sale.id)}
                            disabled={actionLoading === sale.id}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition disabled:opacity-50"
                          >
                            {actionLoading === sale.id
                              ? 'Aprovando...'
                              : 'Aprovar'}
                          </button>
                          <button
                            onClick={() => handleRejectSale(sale.id)}
                            disabled={actionLoading === sale.id}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition disabled:opacity-50"
                          >
                            {actionLoading === sale.id
                              ? 'Rejeitando...'
                              : 'Rejeitar'}
                          </button>
                        </div>
                      )}
                      {sale.status === 'approved_manually' && (
                        <span className="text-green-600 font-medium text-xs flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Aprovada
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
