CREATE TABLE public.clientes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), nome text NOT NULL, cnpj text DEFAULT '', cidade_uf text DEFAULT '', vigencia date, aprovado_por text DEFAULT '', jornada_semanal numeric DEFAULT 44, dia_inicio text DEFAULT 'Segunda-feira', dia_fim text DEFAULT 'Sexta-feira', hora_entrada text DEFAULT '08:00', hora_saida text DEFAULT '18:00', intervalo text DEFAULT '01:00', sistema_ponto text DEFAULT '', canal_denuncias text DEFAULT '', responsavel_apuracao text DEFAULT '', prazo_apuracao_dias int DEFAULT 15, valor_max_brindes numeric DEFAULT 0, mensagem_lideranca text DEFAULT '', incluir_notas_consultor boolean NOT NULL DEFAULT true, criado_em timestamptz DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.clientes TO authenticated; GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_clients ON public.clientes FOR ALL TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());
CREATE INDEX clientes_owner ON public.clientes(user_id);
CREATE TABLE public.colaboradores (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE, nome text DEFAULT '', cargo text DEFAULT '', departamento text DEFAULT '', admissao date, posto text DEFAULT '');
GRANT SELECT,INSERT,UPDATE,DELETE ON public.colaboradores TO authenticated; GRANT ALL ON public.colaboradores TO service_role;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_colaboradores ON public.colaboradores FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.clientes c WHERE c.id=cliente_id AND c.user_id=auth.uid())) WITH CHECK (EXISTS(SELECT 1 FROM public.clientes c WHERE c.id=cliente_id AND c.user_id=auth.uid()));
CREATE TABLE public.sancoes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE, ordem int, situacao text, medida text, recorrencia text);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.sancoes TO authenticated; GRANT ALL ON public.sancoes TO service_role;
ALTER TABLE public.sancoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_sancoes ON public.sancoes FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.clientes c WHERE c.id=cliente_id AND c.user_id=auth.uid())) WITH CHECK (EXISTS(SELECT 1 FROM public.clientes c WHERE c.id=cliente_id AND c.user_id=auth.uid()));
CREATE TABLE public.turnos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE, nome text, sigla text, inicio text, fim text, intervalo_min int DEFAULT 0, UNIQUE(id,cliente_id));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.turnos TO authenticated; GRANT ALL ON public.turnos TO service_role;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_turnos ON public.turnos FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.clientes c WHERE c.id=cliente_id AND c.user_id=auth.uid())) WITH CHECK (EXISTS(SELECT 1 FROM public.clientes c WHERE c.id=cliente_id AND c.user_id=auth.uid()));
CREATE TABLE public.postos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE, posto text, turno_id uuid, pessoas_por_dia int DEFAULT 1, escala text DEFAULT '5x2' CHECK(escala IN ('5x2','6x1','12x36','4x2')), operacao text DEFAULT 'segsex' CHECK(operacao IN ('todos','segsab','segsex')), FOREIGN KEY(turno_id,cliente_id) REFERENCES public.turnos(id,cliente_id));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.postos TO authenticated; GRANT ALL ON public.postos TO service_role;
ALTER TABLE public.postos ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_postos ON public.postos FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.clientes c WHERE c.id=cliente_id AND c.user_id=auth.uid())) WITH CHECK (EXISTS(SELECT 1 FROM public.clientes c WHERE c.id=cliente_id AND c.user_id=auth.uid()));
CREATE TABLE public.cargos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE, familia text, cargo text, nivel int DEFAULT 1, trilha text DEFAULT 'Técnica' CHECK(trilha IN ('Técnica','Gestão')), salario_base numeric DEFAULT 0, tempo_minimo_meses int DEFAULT 0, requisitos text);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.cargos TO authenticated; GRANT ALL ON public.cargos TO service_role;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_cargos ON public.cargos FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.clientes c WHERE c.id=cliente_id AND c.user_id=auth.uid())) WITH CHECK (EXISTS(SELECT 1 FROM public.clientes c WHERE c.id=cliente_id AND c.user_id=auth.uid()));
CREATE TABLE public.config_cargos (cliente_id uuid PRIMARY KEY REFERENCES public.clientes(id) ON DELETE CASCADE, steps int DEFAULT 5, pct_entre_steps numeric DEFAULT 4);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.config_cargos TO authenticated; GRANT ALL ON public.config_cargos TO service_role;
ALTER TABLE public.config_cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_config ON public.config_cargos FOR ALL TO authenticated USING (EXISTS(SELECT 1 FROM public.clientes c WHERE c.id=cliente_id AND c.user_id=auth.uid())) WITH CHECK (EXISTS(SELECT 1 FROM public.clientes c WHERE c.id=cliente_id AND c.user_id=auth.uid()));
CREATE FUNCTION public.initialize_cliente() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
INSERT INTO public.config_cargos(cliente_id) VALUES(NEW.id);
INSERT INTO public.sancoes(cliente_id,ordem,situacao,medida,recorrencia) VALUES
(NEW.id,1,'Atraso reiterado / descumprimento leve de normas','Advertência verbal, registrada em ata','1ª ocorrência'),
(NEW.id,2,'Reincidência em falta leve','Advertência por escrito','2ª ocorrência'),
(NEW.id,3,'Falta grave (indisciplina, insubordinação)','Suspensão de 1 a 3 dias','Conforme gravidade'),
(NEW.id,4,'Falta gravíssima (art. 482 da CLT)','Rescisão por justa causa','Após apuração formal'); RETURN NEW; END $$;
CREATE TRIGGER initialize_cliente AFTER INSERT ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.initialize_cliente();
CREATE INDEX colaboradores_cliente ON public.colaboradores(cliente_id); CREATE INDEX sancoes_cliente ON public.sancoes(cliente_id); CREATE INDEX turnos_cliente ON public.turnos(cliente_id); CREATE INDEX postos_cliente ON public.postos(cliente_id); CREATE INDEX cargos_cliente ON public.cargos(cliente_id);