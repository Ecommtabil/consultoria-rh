DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin','office'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_roles ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.is_office_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'admin')
$$;
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'eliezerraulcunha@outlook.com'
ON CONFLICT DO NOTHING;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['clientes','cargos','colaboradores','config_cargos','escalas','ferias','postos','sancoes','turnos'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS office_all ON public.%I', t);
    EXECUTE format('CREATE POLICY office_all ON public.%I FOR ALL TO authenticated USING (public.is_office_member()) WITH CHECK (public.is_office_member())', t);
  END LOOP;
END $$;