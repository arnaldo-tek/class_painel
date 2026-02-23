-- Tabela de transferências Pagar.me
CREATE TABLE public.transferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pagarme_transfer_id TEXT NOT NULL UNIQUE,
  recipient_id TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as transferências
CREATE POLICY "admins_read_transferencias" ON public.transferencias
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Professores podem ver suas próprias transferências
CREATE POLICY "professors_read_own_transferencias" ON public.transferencias
  FOR SELECT
  USING (requested_by = auth.uid());

-- Apenas edge functions (service role) podem inserir
CREATE POLICY "service_insert_transferencias" ON public.transferencias
  FOR INSERT
  WITH CHECK (true);
