import { describe,it,expect } from 'vitest';
import { excelDate,excelTime,numberBR,normalize,parseSheets } from '@/lib/governanca';
describe('Importação de planilhas',()=>{
 it('aceita salário R$ 3.500,00',()=>expect(numberBR('R$ 3.500,00')).toBe(3500));
 it('converte data serial do Excel',()=>expect(excelDate(45292)).toBe('2024-01-01'));
 it('converte hora numérica do Excel',()=>expect(excelTime(0.5)).toBe('12:00'));
 it('ignora acentos e maiúsculas',()=>expect(normalize(' AdMISSÃO ')).toBe('admissao'));
 it('reconhece aba pelos cabeçalhos',()=>expect(parseSheets({Equipe:[['NOME','CARGO','DEPARTAMENTO','ADMISSAO','POSTO'],['Ana','Analista','RH',45292,'Sede']]}).colaboradores).toEqual([{nome:'Ana',cargo:'Analista',departamento:'RH',admissao:'2024-01-01',posto:'Sede'}]));
 it('mantém ausentes as abas não importadas',()=>{const parsed=parseSheets({Colaboradores:[['Nome','Cargo','Departamento','Admissão','Posto']]});expect(parsed).toEqual({colaboradores:[]});expect('cargos' in parsed).toBe(false);});
 it('converte campos da empresa',()=>expect(parseSheets({Empresa:[['Campo','Valor'],['vigencia',45292],['hora_entrada',0.5],['incluir_notas_consultor','Não']]}).empresa).toEqual({vigencia:'2024-01-01',hora_entrada:'12:00',incluir_notas_consultor:false}));
 it('valida escala 5x2, 6x1, 12x36 e 4x2',()=>{for(const escala of ['5x2','6x1','12x36','4x2'])expect(parseSheets({Postos:[['Posto','Turno','Pessoas por dia','Escala','Operação'],['Sede','D',1,escala,'todos']]}).postos?.[0]?.['escala']).toBe(escala);expect(()=>parseSheets({Postos:[['Posto','Turno','Pessoas por dia','Escala','Operação'],['Sede','D',1,'7x0','todos']]})).toThrow('Escala inválida');});
});