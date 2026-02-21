
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Convenience function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- RLS for user_roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Sequence for inscription numbers
CREATE SEQUENCE public.inscricao_seq START 1;

-- Function to generate inscription number
CREATE OR REPLACE FUNCTION public.generate_numero_inscricao()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_val INT;
  year_part TEXT;
BEGIN
  seq_val := nextval('public.inscricao_seq');
  year_part := EXTRACT(YEAR FROM now())::TEXT;
  RETURN 'ITS' || year_part || '-' || LPAD(seq_val::TEXT, 4, '0');
END;
$$;

-- Inscricoes table
CREATE TABLE public.inscricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_inscricao TEXT NOT NULL UNIQUE DEFAULT public.generate_numero_inscricao(),
  nome_completo TEXT NOT NULL,
  cpf TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  escolaridade TEXT NOT NULL,
  modalidade TEXT NOT NULL CHECK (modalidade IN ('presencial', 'correspondencia')),
  nucleo TEXT,
  status TEXT NOT NULL DEFAULT 'aguardando_pagamento' CHECK (status IN ('aguardando_pagamento', 'comprovante_enviado', 'confirmada', 'pagamento_nao_identificado')),
  comprovante_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;

-- RLS policies for inscricoes
CREATE POLICY "Anyone can create inscricao" ON public.inscricoes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all inscricoes" ON public.inscricoes
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update inscricoes" ON public.inscricoes
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow public to read their own inscricao by numero_inscricao (for payment page)
CREATE POLICY "Anyone can read own inscricao by numero" ON public.inscricoes
  FOR SELECT USING (true);

-- Allow public to update comprovante_url and status to comprovante_enviado
CREATE POLICY "Anyone can upload comprovante" ON public.inscricoes
  FOR UPDATE
  USING (true)
  WITH CHECK (status = 'comprovante_enviado');

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_inscricoes_updated_at
  BEFORE UPDATE ON public.inscricoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for comprovantes
INSERT INTO storage.buckets (id, name, public) VALUES ('comprovantes', 'comprovantes', true);

-- Storage policies
CREATE POLICY "Anyone can upload comprovantes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'comprovantes');

CREATE POLICY "Anyone can view comprovantes" ON storage.objects
  FOR SELECT USING (bucket_id = 'comprovantes');

CREATE POLICY "Admins can delete comprovantes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'comprovantes' AND public.is_admin());
