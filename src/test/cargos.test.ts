import { describe, expect, it } from 'vitest';
import { alertas, amplitude, gerarFamilia, parseCargosPlanilha, parseSalario, pctBR, steps } from '@/lib/cargos/calc';
describe('cargos e salários', () => {
  it('steps: base 2200, 5 steps, 4%', () => expect(steps(2200, 5, 4)).toEqual([2200, 2288, 2379.52, 2474.7, 2573.69]));
  it('amplitude 5 steps a 4% = 17,0%', () => expect(pctBR(amplitude(5, 4))).toBe('17,0%'));
  it('gera família 3 níveis, base 3500, 15%', () => { const f = gerarFamilia({ familia: 'Vendas', cargo: 'Vendedor', base: 3500, niveis: 3, pct: 15, trilha: 'Técnica' }, []);
    expect(f.map(c => c.salario_base)).toEqual([3500, 4025, 4628.75]); expect(f.map(c => c.cargo)).toEqual(['Vendedor I', 'Vendedor II', 'Vendedor III']); expect(f.map(c => c.tempo_minimo_meses)).toEqual([0, 12, 12]); });
  it('família continua do maior nível existente e 1 nível não leva numeral', () => { const f = gerarFamilia({ familia: 'vendas', cargo: 'Gerente', base: 8000, niveis: 1, pct: 15, trilha: 'Gestão' }, [{ familia: 'Vendas', cargo: 'x', nivel: 3, trilha: null, salario_base: 1, tempo_minimo_meses: 0, requisitos: null }]);
    expect(f[0]).toMatchObject({ cargo: 'Gerente', nivel: 4 }); });
  it('salário em texto', () => expect(parseSalario('R$ 3.500,00')).toBe(3500));
  it('importa planilha com cabeçalhos sem acento e trilha gest', () => { const r = parseCargosPlanilha([['FAMILIA', 'cargo', 'Nivel', 'Trilha', 'Salario base', 'Tempo minimo (meses)', 'Requisitos'], ['Adm', 'Coordenador', 4, 'gestao', 'R$ 6.200,00', 0, '']]);
    expect(r.linhas[0]).toMatchObject({ trilha: 'Gestão', salario_base: 6200, nivel: 4 }); expect(r.avisos).toEqual([]); });
  it('alerta nível maior abaixo de nível menor e cargo sem salário', () => { const a = alertas([{ familia: 'A', cargo: 'X I', nivel: 1, trilha: 'Técnica', salario_base: 3000, tempo_minimo_meses: 0, requisitos: null }, { familia: 'A', cargo: 'X II', nivel: 2, trilha: 'Técnica', salario_base: 2500, tempo_minimo_meses: 0, requisitos: null }, { familia: 'A', cargo: 'Y', nivel: 3, trilha: 'Técnica', salario_base: null, tempo_minimo_meses: 0, requisitos: null }]);
    expect(a).toHaveLength(2); });
});
