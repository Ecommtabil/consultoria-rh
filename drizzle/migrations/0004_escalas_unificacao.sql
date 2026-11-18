
DROP FUNCTION IF EXISTS public.import_cliente(uuid,jsonb);
DROP FUNCTION IF EXISTS public.duplicate_cliente(uuid);
COMMENT ON TABLE public.turnos IS 'DEPRECATED: replaced by escala_config';
COMMENT ON TABLE public.postos IS 'DEPRECATED: replaced by escala_config';

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS escala_config jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.colaboradores ADD COLUMN setor text;
UPDATE public.colaboradores SET setor=posto;
COMMENT ON COLUMN public.colaboradores.posto IS 'DEPRECATED: replaced by setor';
ALTER TABLE public.colaboradores
  ADD COLUMN matricula text, ADD COLUMN sexo text CHECK (sexo IN ('F','M')),
  ADD COLUMN jornada_atual text CHECK (jornada_atual IN ('6x1','5x2')),
  ADD COLUMN horas_semanais numeric, ADD COLUMN entrada text, ADD COLUMN saida text,
  ADD COLUMN sab_modo text NOT NULL DEFAULT 'igual' CHECK (sab_modo IN ('igual','diferente','folga')), ADD COLUMN sab_entrada text, ADD COLUMN sab_saida text,
  ADD COLUMN dom_modo text NOT NULL DEFAULT 'igual' CHECK (dom_modo IN ('igual','diferente','folga')), ADD COLUMN dom_entrada text, ADD COLUMN dom_saida text,
  ADD COLUMN salario numeric,
  ADD COLUMN nova_jornada text NOT NULL DEFAULT 'setor' CHECK (nova_jornada IN ('setor','manter','6x1-40','6x1-42','6x1-44','5x2-40','5x2-42','5x2-44'));

CREATE TABLE public.ferias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  inicio date NOT NULL, fim date NOT NULL, CHECK (fim >= inicio)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ferias TO authenticated;
GRANT ALL ON public.ferias TO service_role;
ALTER TABLE public.ferias ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.escalas (
  id text NOT NULL,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cliente_id, id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.escalas TO authenticated;
GRANT ALL ON public.escalas TO service_role;
ALTER TABLE public.escalas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_clients ON public.clientes;
DROP POLICY IF EXISTS own_colaboradores ON public.colaboradores;
DROP POLICY IF EXISTS own_sancoes ON public.sancoes;
DROP POLICY IF EXISTS own_cargos ON public.cargos;
DROP POLICY IF EXISTS own_config ON public.config_cargos;
DROP POLICY IF EXISTS own_turnos ON public.turnos;
DROP POLICY IF EXISTS own_postos ON public.postos;
CREATE POLICY office_all ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY office_all ON public.colaboradores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY office_all ON public.sancoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY office_all ON public.cargos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY office_all ON public.config_cargos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY office_all ON public.turnos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY office_all ON public.postos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY office_all ON public.ferias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY office_all ON public.escalas FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE FUNCTION public.import_cliente(p_cliente uuid, p_bundle jsonb, p_modo text DEFAULT 'substituir')
RETURNS void LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE r jsonb; e jsonb; BEGIN
IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM clientes WHERE id=p_cliente) THEN RAISE EXCEPTION 'Cliente não encontrado'; END IF;
IF p_bundle ? 'empresa' THEN e := p_bundle->'empresa';
UPDATE clientes SET nome=COALESCE(e->>'nome',nome), cnpj=COALESCE(e->>'cnpj',cnpj), cidade_uf=COALESCE(e->>'cidade_uf',cidade_uf), vigencia=COALESCE((e->>'vigencia')::date,vigencia), aprovado_por=COALESCE(e->>'aprovado_por',aprovado_por), jornada_semanal=COALESCE((e->>'jornada_semanal')::numeric,jornada_semanal), dia_inicio=COALESCE(e->>'dia_inicio',dia_inicio), dia_fim=COALESCE(e->>'dia_fim',dia_fim), hora_entrada=COALESCE(e->>'hora_entrada',hora_entrada), hora_saida=COALESCE(e->>'hora_saida',hora_saida), intervalo=COALESCE(e->>'intervalo',intervalo), sistema_ponto=COALESCE(e->>'sistema_ponto',sistema_ponto), canal_denuncias=COALESCE(e->>'canal_denuncias',canal_denuncias), responsavel_apuracao=COALESCE(e->>'responsavel_apuracao',responsavel_apuracao), prazo_apuracao_dias=COALESCE((e->>'prazo_apuracao_dias')::int,prazo_apuracao_dias), valor_max_brindes=COALESCE((e->>'valor_max_brindes')::numeric,valor_max_brindes), mensagem_lideranca=COALESCE(e->>'mensagem_lideranca',mensagem_lideranca), incluir_notas_consultor=COALESCE((e->>'incluir_notas_consultor')::boolean,incluir_notas_consultor) WHERE id=p_cliente; END IF;
IF p_bundle ? 'colaboradores' THEN
  IF p_modo <> 'adicionar' THEN DELETE FROM colaboradores WHERE cliente_id=p_cliente; END IF;
  FOR r IN SELECT value FROM jsonb_array_elements(p_bundle->'colaboradores') LOOP
    INSERT INTO colaboradores(cliente_id,nome,matricula,setor,departamento,cargo,admissao,sexo,jornada_atual,horas_semanais,entrada,saida,sab_modo,sab_entrada,sab_saida,dom_modo,dom_entrada,dom_saida,salario)
    VALUES(p_cliente,r->>'nome',NULLIF(r->>'matricula',''),NULLIF(r->>'setor',''),NULLIF(r->>'departamento',''),NULLIF(r->>'cargo',''),NULLIF(r->>'admissao','')::date,NULLIF(r->>'sexo',''),NULLIF(r->>'jornada_atual',''),NULLIF(r->>'horas_semanais','')::numeric,NULLIF(r->>'entrada',''),NULLIF(r->>'saida',''),COALESCE(NULLIF(r->>'sab_modo',''),'igual'),NULLIF(r->>'sab_entrada',''),NULLIF(r->>'sab_saida',''),COALESCE(NULLIF(r->>'dom_modo',''),'igual'),NULLIF(r->>'dom_entrada',''),NULLIF(r->>'dom_saida',''),NULLIF(r->>'salario','')::numeric);
  END LOOP; END IF;
IF p_bundle ? 'cargos' THEN DELETE FROM cargos WHERE cliente_id=p_cliente; FOR r IN SELECT value FROM jsonb_array_elements(p_bundle->'cargos') LOOP INSERT INTO cargos(cliente_id,familia,cargo,nivel,trilha,salario_base,tempo_minimo_meses,requisitos) VALUES(p_cliente,r->>'familia',r->>'cargo',(r->>'nivel')::int,r->>'trilha',(r->>'salario_base')::numeric,(r->>'tempo_minimo_meses')::int,r->>'requisitos'); END LOOP; END IF;
END $$;

CREATE FUNCTION public.duplicate_cliente(p_cliente uuid)
RETURNS uuid LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE source clientes; new_id uuid; c colaboradores; old_c uuid; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Acesso negado'; END IF;
SELECT * INTO source FROM clientes WHERE id=p_cliente; IF source.id IS NULL THEN RAISE EXCEPTION 'Cliente não encontrado'; END IF;
source.id=gen_random_uuid(); source.nome=source.nome||' (cópia)'; source.criado_em=now(); source.user_id=auth.uid(); new_id=source.id;
INSERT INTO clientes SELECT (source).*;
FOR c IN SELECT * FROM colaboradores WHERE cliente_id=p_cliente LOOP
  old_c := c.id; c.id := gen_random_uuid(); c.cliente_id := new_id; INSERT INTO colaboradores SELECT (c).*;
  INSERT INTO ferias(cliente_id,colaborador_id,inicio,fim) SELECT new_id,c.id,inicio,fim FROM ferias WHERE colaborador_id=old_c;
END LOOP;
DELETE FROM sancoes WHERE cliente_id=new_id; INSERT INTO sancoes(cliente_id,ordem,situacao,medida,recorrencia) SELECT new_id,ordem,situacao,medida,recorrencia FROM sancoes WHERE cliente_id=p_cliente;
UPDATE config_cargos SET steps=x.steps,pct_entre_steps=x.pct_entre_steps FROM config_cargos x WHERE x.cliente_id=p_cliente AND config_cargos.cliente_id=new_id;
INSERT INTO cargos(cliente_id,familia,cargo,nivel,trilha,salario_base,tempo_minimo_meses,requisitos) SELECT new_id,familia,cargo,nivel,trilha,salario_base,tempo_minimo_meses,requisitos FROM cargos WHERE cliente_id=p_cliente;
INSERT INTO escalas(id,cliente_id,dados) SELECT id,new_id,dados FROM escalas WHERE cliente_id=p_cliente;
RETURN new_id; END $$;
