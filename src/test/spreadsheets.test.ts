import { describe,it,expect } from 'vitest';
import { excelDate,excelTime,numberBR,normalize,parseSheets } from '@/lib/governanca';
describe('Importação de planilhas',()=>{
 it('aceita salário R$ 3.500,00',()=>expect(numberBR('R$ 3.500,00')).toBe(3500));
 it('converte data serial do Excel',()=>expect(excelDate(45292)).toBe('2024-01-01'));
 it('converte hora numérica do Excel',()=>expect(excelTime(0.5)).toBe('12:00'));
 it('ignora acentos e maiúsculas',()=>expect(normalize(' AdMISSÃO ')).toBe('admissao'));
 it('reconhece aba pelos apelidos dos cabeçalhos',()=>{const r=parseSheets({Equipe:[['FUNCIONÁRIO','Função','Área','Admissão','Gênero','CargaHoraria','Início','Fim'],['Ana','Analista','RH',45292,'F',42,0.3125,'17:00']]}).colaboradores?.[0];expect(r).toMatchObject({nome:'Ana',cargo:'Analista',setor:'RH',departamento:'RH',admissao:'2024-01-01',sexo:'F',horas_semanais:42,entrada:'07:30',saida:'17:00'});});
 it('sábado em branco = mesmo horário, preenchido = próprio, FOLGA = folga fixa',()=>{const r=parseSheets({Colaboradores:[['Nome','Sábado entrada','Sábado saída','Domingo entrada'],['A','',''],['B','08:00','12:00','FOLGA']]}).colaboradores!;expect(r[0]).toMatchObject({sab_modo:'igual',dom_modo:'igual'});expect(r[1]).toMatchObject({sab_modo:'diferente',sab_entrada:'08:00',sab_saida:'12:00',dom_modo:'folga'});});
 it('avisa por linha sem bloquear',()=>{const b=parseSheets({Colaboradores:[['Nome','Sexo','Entrada'],['Ana','','25:00']]});expect(b.colaboradores).toHaveLength(1);expect(b.avisosColaboradores?.[0]?.avisos).toEqual(['Sexo não informado','Entrada inválida (“25:00”)']);});
 it('converte campos da empresa',()=>expect(parseSheets({Empresa:[['Campo','Valor'],['vigencia',45292],['hora_entrada',0.5],['incluir_notas_consultor','Não']]}).empresa).toEqual({vigencia:'2024-01-01',hora_entrada:'12:00',incluir_notas_consultor:false}));
 it('ignora abas antigas Turnos e Postos',()=>expect(parseSheets({Turnos:[['Nome','Sigla']],Cargos:[['Família','Cargo','Nível','Trilha','Salário base','Tempo mínimo (meses)','Requisitos']]})).toEqual({cargos:[]}));
});
