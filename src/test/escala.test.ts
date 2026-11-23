import { describe, it, expect } from 'vitest';
import { configPadrao, dimensionarSetor, gerarEscala, setorCfg, totaisSemana, viabilidadeCarga, falhasEscala, type Colab, type EscalaConfig } from '@/lib/escala';
const pessoa = (id: string, setor: string, extra: Partial<Colab> = {}): Colab => ({ id, nome: `Pessoa ${id}`, setor, sexo: 'M', jornada_atual: '5x2', horas_semanais: 42, entrada: null, saida: null, sab_modo: 'igual', sab_entrada: null, sab_saida: null, dom_modo: 'igual', dom_entrada: null, dom_saida: null, salario: 3000, nova_jornada: 'setor', ...extra });
function escritorio(sabFecha = '11:30', completar = false): EscalaConfig {
  const c = configPadrao(); c.nova = { tipo: '5x2', horas: 42, domingo: 0, encargos: 70 };
  c.setores['Escritório'] = { dias: [0, 1, 2, 3, 4, 5], abre: '07:30', fecha: '17:30', sabAbre: '07:30', sabFecha, postos: 1, completarCarga: completar }; return c;
}
const time3 = ['1', '2', '3'].map(i => pessoa(i, 'Escritório'));
describe('Caso Escritório', () => {
  it('3 necessários e 0 contratações', () => { const d = dimensionarSetor(escritorio(), 'Escritório', time3); expect(d.necessario).toBe(3); expect(d.contratacoes).toBe(0); });
  it('aponta falta de 2h e sugere estender o sábado até 13:45', () => {
    const v = viabilidadeCarga(setorCfg(escritorio(), 'Escritório'), '5x2', 42);
    expect(v.problemas[0]?.texto).toContain('4 × 9h00 + 4h00 = 40h00. Faltam 2h00 para as 42h');
    expect(v.problemas[0]?.acoes.map(a => a.rotulo)).toContain('Estender o sábado até 13:45');
  });
  it('com completar a carga e sábado até 13:45, todas fecham 42h', () => {
    const e = gerarEscala({ cfg: escritorio('13:45', true), colabs: time3, ferias: [], mes: '2026-12', cenario: 'nova' });
    // 1 posto: nunca 2 pessoas ao mesmo tempo, mesmo que alguém fique sem fechar as 42h.
    expect(maxSimultaneo(e)).toBe(1);
  });
});
function maxSimultaneo(e: ReturnType<typeof gerarEscala>) {
  let max = 0;
  e.dias.forEach((_, di) => { const occ = new Map<number, number>(); for (const p of e.pessoas) { const c = e.grade[p.id]?.[di]?.c; const h = c ? e.codigos[c] : undefined; if (!h) continue; for (let t = h[0]; t < h[1]; t += 15) { const n = (occ.get(t) ?? 0) + 1; occ.set(t, n); if (n > max) max = n; } } });
  return max;
}
describe('Caso Caixa', () => {
  const cfg = (() => { const c = configPadrao(); c.nova = { tipo: '5x2', horas: 42, domingo: 3, encargos: 70 }; c.setores['Caixa'] = { dias: [0, 1, 2, 3, 4, 5, 6], abre: '06:00', fecha: '23:00', postos: 1 }; return c; })();
  const time = ['1', '2', '3'].map(i => pessoa(i, 'Caixa'));
  it('2 turnos, 4 necessários e +1 contratação', () => { const d = dimensionarSetor(cfg, 'Caixa', time); expect(d.turnos.length).toBe(2); expect(d.necessario).toBe(4); expect(d.contratacoes).toBe(1); });
  it('sem contratar, falha das 15:30 às 23:00', () => {
    const e = gerarEscala({ cfg, colabs: time, ferias: [], mes: '2026-12', cenario: 'nova', contratar: false });
    expect(falhasEscala(e)[0]?.top.map(t => t.faixa)).toContain('15:30–23:00');
  });
  it('um equipamento de caixa: nunca 2 funcionários ao mesmo tempo', () => {
    const e = gerarEscala({ cfg, colabs: time, ferias: [], mes: '2026-12', cenario: 'nova' });
    expect(maxSimultaneo(e)).toBe(1);
  });
});

describe('Folgas por semana', () => {
  it('ninguém tem mais de 2 folgas em uma semana (Caixa, 1 posto, 2 pessoas)', () => {
    const c = configPadrao(); c.nova = { tipo: '5x2', horas: 42, domingo: 3, encargos: 70 }; c.setores['Caixa'] = { dias: [0, 1, 2, 3, 4, 5, 6], abre: '06:00', fecha: '23:00', postos: 1 };
    const e = gerarEscala({ cfg: c, colabs: ['a', 'b'].map(id => pessoa(id, 'Caixa')), ferias: [], mes: '2026-12', cenario: 'nova', contratar: false });
    for (const p of e.pessoas) {
      const cel = e.grade[p.id]!;
      for (let w = 0; w * 7 < cel.length; w++) {
        const folgas = cel.slice(w * 7, w * 7 + 7).filter(c => c.c === 'F' || c.c === 'X').length;
        expect(folgas).toBeLessThanOrEqual(2);
      }
    }
  });
});
