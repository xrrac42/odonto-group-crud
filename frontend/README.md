# Frontend do OdontoGroup

Frontend da aplicação OdontoGroup - Sistema de vendas de planos odontológicos.

## Setup

```bash
npm install
npm run dev
```

## Dependências a Instalar

```bash
npm install react react-dom vite typescript tailwindcss
npm install react-hook-form zod @hookform/resolvers
npm install @supabase/supabase-js
npm install -D @types/react @types/react-dom
```

## Variáveis de Ambiente

Crie `.env.local` na raiz:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

## Estrutura

- `src/types/` - Tipos TypeScript
- `src/hooks/` - Custom hooks (useAuth, useSales)
- `src/contexts/` - Context API (AuthContext)
- `src/services/` - Serviços (saleService)
- `src/lib/` - Clientes (supabaseClient)
- `src/components/` - Componentes React
  - `sales/` - Componentes de venda (Stepper)
  - `admin/` - Componentes admin (Dashboard)

## Router (Exemplo)

```tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import LoginPage from '@/pages/LoginPage';
import SalesPage from '@/pages/SalesPage';
import AdminPage from '@/pages/AdminPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/vendas" element={<SalesPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

## Build

```bash
npm run build
```

Saída em `dist/`
