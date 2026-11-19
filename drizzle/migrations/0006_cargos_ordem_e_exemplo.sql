ALTER TABLE public.cargos ADD COLUMN IF NOT EXISTS ordem integer;
CREATE OR REPLACE FUNCTION public.initialize_cliente()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$ BEGIN
INSERT INTO public.config_cargos(cliente_id) VALUES(NEW.id);
INSERT INTO public.sancoes(cliente_id,ordem,situacao,medida,recorrencia) VALUES
(NEW.id,1,'Atraso reiterado / descumprimento leve de normas','Advertência verbal, registrada em ata','1ª ocorrência'),
(NEW.id,2,'Reincidência em falta leve','Advertência por escrito','2ª ocorrência'),
(NEW.id,3,'Falta grave (indisciplina, insubordinação)','Suspensão de 1 a 3 dias','Conforme gravidade'),
(NEW.id,4,'Falta gravíssima (art. 482 da CLT)','Rescisão por justa causa','Após apuração formal');
INSERT INTO public.cargos(cliente_id,familia,cargo,nivel,trilha,salario_base,tempo_minimo_meses,requisitos,ordem) VALUES
(NEW.id,'Administrativo (exemplo)','Assistente Administrativo I',1,'Técnica',2200,12,'Ensino médio completo; pacote Office',1),
(NEW.id,'Administrativo (exemplo)','Assistente Administrativo II',2,'Técnica',2530,18,'Curso técnico ou graduação em andamento',2),
(NEW.id,'Administrativo (exemplo)','Analista Administrativo',3,'Técnica',3600,24,'Graduação completa; domínio de processos da área',3),
(NEW.id,'Administrativo (exemplo)','Coordenador Administrativo',4,'Gestão',6200,0,'Experiência em liderança; avaliação de desempenho acima da meta',4);
RETURN NEW; END $function$;