// components/admin/AdminDashboard.tsx
import { useState } from 'react';
import { FileText, Users, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSales } from '../../hooks/useSales';
import AdminSalesList from './AdminSalesList';
import AdminUserManagement from './AdminUserManagement';

type AdminTab = 'sales' | 'users';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('sales');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { sales, loading, error } = useSales(
    statusFilter || dateFrom || dateTo
      ? {
          ...(statusFilter ? { status: statusFilter as any } : {}),
          ...(dateFrom ? { date_from: dateFrom } : {}),
          ...(dateTo ? { date_to: dateTo } : {}),
        }
      : undefined
  );

  if (!user) {
    return <div>Não autenticado</div>;
  }

  if (user.role !== 'admin') {
    return <div>Acesso negado. Apenas administradores podem acessar.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
            <p className="text-gray-600 mt-2">
              Bem-vindo, {user.nome}. Administre vendas e usuários aqui.
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Abas */}
        <div className="flex gap-8 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('sales')}
            className={`pb-4 px-2 font-medium transition flex items-center gap-2 ${
              activeTab === 'sales'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-5 h-5" />
            Vendas
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-2 font-medium transition flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-5 h-5" />
            Usuários
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'sales' && (
          <AdminSalesList
            sales={sales}
            loading={loading}
            error={error}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
        )}

        {activeTab === 'users' && <AdminUserManagement />}
      </div>
    </div>
  );
}
