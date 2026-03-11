// components/admin/AdminUserManagement.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

export interface User {
  id: string;
  nome: string;
  cpf: string;
  role: string;
  adminUserId: string;
}

export interface PaginatedResponse {
  data: User[];
  meta: {
    page: number;
    limit: number;
    total_records: number;
  };
}

export default function AdminUserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cpf: '',
    nome: '',
    password: '',
    role: 'operator' as const,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  React.useEffect(() => {
    console.log('👥 AdminUserManagement montado, carregando usuários...');
    loadUsers();
  }, [page, limit]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://api-odonto.cuidai.xyz/v2/get-all-users?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Erro ao buscar usuários');
      const result: PaginatedResponse = await response.json();
      setUsers(result.data || []);
      setTotalRecords(result.meta.total_records);
    } catch (err) {
      setUsers([]);
      setFormError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshUsers = async () => {
    try {
      setRefreshing(true);
      await loadUsers();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setCreating(true);

    try {
      if (!formData.cpf || !formData.nome || !formData.password) {
        throw new Error('Todos os campos são obrigatórios');
      }
      if (formData.cpf.length !== 11) {
        throw new Error('CPF deve ter 11 dígitos');
      }
      if (formData.password.length < 6) {
        throw new Error('Senha deve ter no mínimo 6 caracteres');
      }
      // Timeout para requisição
      const requestBody = {
        cpf: formData.cpf,
        nome: formData.nome,
        password: formData.password,
        role: formData.role,
        adminUserId: user?.id || ''
      };
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000);
      try {
        const response = await fetch('https://api-odonto.cuidai.xyz/v2/create-operator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Erro ao criar usuário');
        }
        setFormSuccess(`Usuário ${formData.nome} criado com sucesso!`);
        setFormData({ cpf: '', nome: '', password: '', role: 'operator' });
        setShowForm(false);
        await loadUsers();
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          throw new Error('Timeout: A criação do usuário demorou muito. Tente novamente.');
        }
        throw fetchErr;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar usuário';
      setFormError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;

    try {
      // Remover perfil (que por sua vez remove o usuário de auth via foreign key)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setFormSuccess('Usuário removido com sucesso!');
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover usuário';
      setFormError(message);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Carregando usuários...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Botão para adicionar */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleRefreshUsers}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          disabled={refreshing}
        >
          {refreshing ? 'Atualizando...' : 'Atualizar Lista'}
        </button>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancelar' : '+ Adicionar Operador'}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Criar Novo Usuário
          </h2>

          {formError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF *
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12345678901"
                  maxLength={11}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Gerado Automaticamente)
                </label>
                <input
                  type="text"
                  value={formData.cpf ? `${formData.cpf}@sistema.test` : ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  placeholder="Será gerado do CPF"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email gerado automaticamente: CPF@sistema.test
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Perfil *
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as 'admin' | 'operator',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="operator">Operador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="flex gap-4 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                disabled={creating}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Criando...
                  </>
                ) : (
                  'Criar Usuário'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mensagem de sucesso */}
      {formSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          ✓ {formSuccess}
        </div>
      )}

      {/* Lista de usuários */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  CPF
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Perfil
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {user.nome}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-700">
                    {user.cpf}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controles de paginação */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-700">
          Página {page} de {Math.ceil(totalRecords / limit) || 1}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page * limit >= totalRecords}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Próxima
        </button>
        <select
          value={limit}
          onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
          className="ml-4 px-2 py-1 border rounded"
        >
          {[5, 10, 15, 20, 50].map(opt => (
            <option key={opt} value={opt}>{opt} por página</option>
          ))}
        </select>
      </div>
    </div>
  );
}
