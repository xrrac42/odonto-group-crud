-- ============================================================================
-- OdontoGroup - Migração Inicial (001)
-- Cria tabelas base: profiles, clients, sales
-- ============================================================================

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'operator');
CREATE TYPE sale_status AS ENUM ('draft', 'awaiting_signature', 'signed', 'approved_manually');
CREATE TYPE plan_type AS ENUM ('plano_basico', 'plano_standard', 'plano_premium');

-- 3. Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'operator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  data_nascimento DATE NOT NULL,
  nome_mae VARCHAR(255) NOT NULL,
  endereco_completo TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  matricula_origem VARCHAR(100),
  orgao_origem VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  operator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  plan_type plan_type NOT NULL,
  status sale_status NOT NULL DEFAULT 'draft',
  docuseal_submission_id VARCHAR(255),
  docuseal_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for better performance
CREATE INDEX idx_profiles_cpf ON public.profiles(cpf);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_clients_cpf ON public.clients(cpf);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_sales_client_id ON public.sales(client_id);
CREATE INDEX idx_sales_operator_id ON public.sales(operator_id);
CREATE INDEX idx_sales_status ON public.sales(status);
CREATE INDEX idx_sales_created_at ON public.sales(created_at DESC);

-- 7. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Apply triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Profiles: Public can read their own, admins can read all
CREATE POLICY "Users can read their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Profiles: Only admins can create profiles
CREATE POLICY "Only admins can create profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Profiles: Only admins can update profiles
CREATE POLICY "Only admins can update profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Profiles: Only admins can delete profiles
CREATE POLICY "Only admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clients: Operators and admins can read all clients
CREATE POLICY "Authenticated users can read clients" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('operator', 'admin')
    )
  );

-- Clients: Authenticated users can create clients
CREATE POLICY "Authenticated users can create clients" ON public.clients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('operator', 'admin')
    )
  );

-- Clients: Operators and admins can update clients
CREATE POLICY "Authenticated users can update clients" ON public.clients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('operator', 'admin')
    )
  );

-- Sales: Operators see only their own sales, admins see all
CREATE POLICY "Operators see own sales, admins see all" ON public.sales
  FOR SELECT USING (
    operator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sales: Authenticated users can create sales
CREATE POLICY "Authenticated users can create sales" ON public.sales
  FOR INSERT WITH CHECK (
    operator_id = auth.uid()
  );

-- Sales: Operators can update their own sales, admins can update all
CREATE POLICY "Operators update own sales, admins update all" ON public.sales
  FOR UPDATE USING (
    operator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.profiles IS 'Extensão de auth.users com CPF, nome e role (admin/operator)';
COMMENT ON TABLE public.clients IS 'Dados do cliente-prospect para venda de planos odontológicos';
COMMENT ON TABLE public.sales IS 'Registro de vendas com rastreamento DocuSeal e status';
COMMENT ON COLUMN public.sales.docuseal_submission_id IS 'ID da submissão no DocuSeal';
COMMENT ON COLUMN public.sales.docuseal_link IS 'Link de assinatura do DocuSeal para compartilhar com cliente';
