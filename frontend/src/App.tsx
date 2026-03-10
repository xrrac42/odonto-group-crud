import React from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Lightbulb } from 'lucide-react'
import logo from '../assets/logo-colorida.png'
import { AuthProvider } from './contexts/AuthContext'
import OperatorLayout from './components/OperatorLayout'
import SalesDetail from './components/SalesDetail'
import SalesConfirmation from './components/SalesConfirmation'
import SignatureIsolatedPage from './pages/SignatureIsolatedPage'
import AdminDashboard from './components/admin/AdminDashboard'
import { useAuth } from './hooks/useAuth'

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/sales" replace />

  return <>{children}</>
}

function RoleHomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  return user.role === 'admin' ? (
    <Navigate to="/admin" replace />
  ) : (
    <Navigate to="/sales" replace />
  )
}

function LoginPage() {
  const { loginWithCPF, error, loading, user } = useAuth()
  const navigate = useNavigate()
  const [cpf, setCpf] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loginError, setLoginError] = React.useState('')

  React.useEffect(() => {
    if (!user) return
    if (user.role === 'admin') {
      navigate('/admin', { replace: true })
    } else {
      navigate('/sales', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    try {
      await loginWithCPF(cpf.replace(/\D/g, ''), password)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao fazer login'
      setLoginError(msg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <img src={logo} alt="OdontoGroup" className="h-45 mx-auto" />
          <p className="text-gray-600 text-sm mt-0">Sistema de Vendas</p>
        </div>

        {(loginError || error) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{loginError || error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
              placeholder="12345678901"
              maxLength={11}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !cpf || !password}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Autenticando...' : 'Entrar'}
          </button>

          <button
            type="button"
            onClick={() => {
              setCpf('12345678901')
              setPassword('teste123')
            }}
            className="w-full px-4 py-2 border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition font-medium"
          >
            🎬 Demo Admin
          </button>
        </form>

        <p className="text-xs text-gray-600 text-center mt-6 flex items-center justify-center gap-2">
          <Lightbulb className="w-4 h-4 text-gray-500" />
          <span>Demo: CPF 12345678901 / Senha teste123</span>
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RoleHomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="/sales"
          element={
            <RequireAuth>
              <OperatorLayout />
            </RequireAuth>
          }
        />
        <Route
          path="/sales/:saleId"
          element={
            <RequireAuth>
              <SalesDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/sales/:saleId/step-1"
          element={
            <RequireAuth>
              <SalesDetail key="step-1" initialStep={1} />
            </RequireAuth>
          }
        />
        <Route
          path="/sales/:saleId/step-2"
          element={
            <RequireAuth>
              <SalesDetail key="step-2" initialStep={2} />
            </RequireAuth>
          }
        />
        <Route
          path="/sales/:saleId/step-3"
          element={
            <RequireAuth>
              <SalesDetail key="step-3" initialStep={3} />
            </RequireAuth>
          }
        />
        <Route
          path="/sales/:saleId/step-4"
          element={
            <RequireAuth>
              <SalesDetail key="step-4" initialStep={4} />
            </RequireAuth>
          }
        />
        <Route
          path="/sales/:saleId/confirmation"
          element={
            <RequireAuth>
              <SalesConfirmation />
            </RequireAuth>
          }
        />
        <Route
          path="/signature/:saleId"
          element={
            <RequireAuth>
              <SignatureIsolatedPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
