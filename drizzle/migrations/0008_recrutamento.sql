CREATE TABLE public.vagas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  titulo text NOT NULL DEFAULT 'Nova vaga',
  descricao text NOT NULL DEFAULT '',
  requisitos text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'aberta',
  criterios jsonb NOT NULL DEFAULT '[]'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vagas TO authenticated;
GRANT ALL ON public.vagas TO service_role;
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "office vagas" ON public.vagas FOR ALL TO authenticated USING (public.is_office_member()) WITH CHECK (public.is_office_member());

CREATE TABLE public.candidatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  vaga_id uuid REFERENCES public.vagas(id) ON DELETE SET NULL,
  nome text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  telefone text NOT NULL DEFAULT '',
  arquivo_path text,
  arquivo_nome text NOT NULL DEFAULT '',
  analise jsonb,
  notas jsonb NOT NULL DEFAULT '{}'::jsonb,
  parecer text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'novo',
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidatos TO authenticated;
GRANT ALL ON public.candidatos TO service_role;
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "office candidatos" ON public.candidatos FOR ALL TO authenticated USING (public.is_office_member()) WITH CHECK (public.is_office_member());

CREATE POLICY "office curriculos read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'curriculos' AND public.is_office_member());
CREATE POLICY "office curriculos insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'curriculos' AND public.is_office_member());
CREATE POLICY "office curriculos delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'curriculos' AND public.is_office_member());