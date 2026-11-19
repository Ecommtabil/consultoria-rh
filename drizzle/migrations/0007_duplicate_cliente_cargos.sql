CREATE OR REPLACE FUNCTION public.duplicate_cliente(p_cliente uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
DELETE FROM cargos WHERE cliente_id=new_id;
INSERT INTO cargos(cliente_id,familia,cargo,nivel,trilha,salario_base,tempo_minimo_meses,requisitos,ordem) SELECT new_id,familia,cargo,nivel,trilha,salario_base,tempo_minimo_meses,requisitos,ordem FROM cargos WHERE cliente_id=p_cliente;
INSERT INTO escalas(id,cliente_id,dados) SELECT id,new_id,dados FROM escalas WHERE cliente_id=p_cliente;
RETURN new_id; END $function$;