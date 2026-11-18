import type { Colab, EscalaConfig, Regime } from './tipos';
import { diasTrabalho, ordemEntrada, regimeAtual, regimePessoa, turnoRelogio } from './regime';
import { horarioBase, horarioDia, minutos, setorCfg, type SetorResolvido } from './operacao';
export type TurnoDia = { ini: number; fim: number } | null;
/** Turnos[t][dia]: janela do turno t em cada dia (null se não existe). */
export function turnosSetor(sc: SetorResolvido, regime: Regime, horas: number): TurnoDia[][] {
  const rel = turnoRelogio(horas, regime); const base = horarioBase(sc);
  const T = base ? Math.max(1, Math.ceil(minutos(base) / rel)) : 0;
  const out: TurnoDia[][] = Array.from({ length: T }, () => Array<TurnoDia>(7).fill(null));
  for (let d = 0; d < 7; d++) {
    const h = horarioDia(sc, d); if (!h) continue; const len = minutos(h);
    const Td = Math.min(T, Math.max(1, Math.ceil(len / rel)));
    for (let t = 0; t < Td; t++) {
      if (len <= rel) { out[t]![d] = { ini: h.ini, fim: h.fim }; continue; }
      const ini = Math.round(h.ini + (Td === 1 ? 0 : (t * (len - rel)) / (Td - 1)));
      out[t]![d] = { ini, fim: Math.min(h.fim, ini + Math.round(rel)) };
    }
  }
  return out;
}
export const turnosPorDia = (turnos: TurnoDia[][], d: number) => turnos.filter(t => t[d]).length;
export type Alocado = { id: string | null; nome: string; turno: number; contrib: number; contratacao: boolean; regime: Regime; horas: number };
export type Dimensionamento = {
  setor: string; regime: Regime; horas: number; turnos: TurnoDia[][]; abertos: number; postos: number; postosPadrao: number;
  necessidade: number[]; necessarioTurnos: number; necessarioHoras: number; necessario: number; equipe: number;
  alocacao: Alocado[]; contratacoes: number; salarioMedio: number; custo: number; cobertura: number[];
};
export function postosPadrao(sc: SetorResolvido, pessoas: Colab[]) {
  const abertos = [0, 1, 2, 3, 4, 5, 6].filter(d => horarioDia(sc, d)).length; if (!abertos) return 1;
  const cont = new Map<string, number>(); for (const p of pessoas) { const r = regimeAtual(p); const k = `${r.regime}-${r.horas}`; cont.set(k, (cont.get(k) ?? 0) + 1); }
  const pred = [...cont.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '6x1-44'; const [reg, hs] = pred.split('-') as [Regime, string];
  const base = horarioBase(sc); const T = base ? Math.max(1, Math.ceil(minutos(base) / turnoRelogio(Number(hs), reg))) : 1;
  return Math.max(1, Math.floor((pessoas.length * Math.min(diasTrabalho(reg), abertos)) / (T * abertos)));
}
export function dimensionarSetor(cfg: EscalaConfig, setor: string, pessoas: Colab[], salarioDe: (c: Colab) => number | null = c => c.salario): Dimensionamento {
  const sc = setorCfg(cfg, setor); const reg = regimePessoa({ nova_jornada: 'setor' } as Colab, cfg, setor, 'nova');
  const turnos = turnosSetor(sc, reg.regime, reg.horas); const abertosD = [0, 1, 2, 3, 4, 5, 6].filter(d => horarioDia(sc, d)); const abertos = abertosD.length;
  const pp = postosPadrao(sc, pessoas); const postos = sc.postos && sc.postos > 0 ? sc.postos : pp;
  const necessidade = turnos.map(t => postos * t.filter(Boolean).length);
  const dpp = Math.min(diasTrabalho(reg.regime), abertos) || 1;
  const necessarioTurnos = necessidade.reduce((s, n) => s + Math.ceil(n / dpp), 0);
  const horasAbertas = abertosD.reduce((s, d) => s + minutos(horarioDia(sc, d)), 0);
  const necessarioHoras = Math.ceil((postos * horasAbertas) / (reg.horas * 60) - 1e-9);
  const necessario = Math.max(necessarioTurnos, necessarioHoras);
  const cobertura = necessidade.map(() => 0); const alocacao: Alocado[] = [];
  const ordenadas = [...pessoas].sort((a, b) => ordemEntrada(a) - ordemEntrada(b) || (a.nome ?? '').localeCompare(b.nome ?? ''));
  const ratio = (t: number) => cobertura[t]! / (necessidade[t] || 1);
  const menor = () => cobertura.reduce((best, _, t) => (ratio(t) < ratio(best) ? t : best), 0);
  let t = 0; const sobras: Alocado[] = [];
  for (const p of ordenadas) {
    const r = regimePessoa(p, cfg, setor, 'nova'); const contrib = Math.min(diasTrabalho(r.regime), abertos);
    while (t < turnos.length && cobertura[t]! >= necessidade[t]!) t++;
    const a: Alocado = { id: p.id, nome: p.nome ?? '', turno: t, contrib, contratacao: false, regime: r.regime, horas: r.horas };
    if (t < turnos.length) { cobertura[t] = cobertura[t]! + contrib; alocacao.push(a); } else sobras.push(a);
  }
  for (const a of sobras) { a.turno = menor(); cobertura[a.turno] = cobertura[a.turno]! + a.contrib; alocacao.push(a); }
  let n = 0; const contratar = (turno: number) => { n++; cobertura[turno] = cobertura[turno]! + dpp; alocacao.push({ id: null, nome: `Contratação ${n}`, turno, contrib: dpp, contratacao: true, regime: reg.regime, horas: reg.horas }); };
  if (turnos.length) {
    for (let i = 0; i < turnos.length; i++) while (cobertura[i]! < necessidade[i]!) contratar(i);
    while (pessoas.length + n < necessario) contratar(menor());
  }
  const sal = pessoas.map(salarioDe).filter((v): v is number => v != null && v > 0);
  const salarioMedio = sal.length ? sal.reduce((a, b) => a + b, 0) / sal.length : 0;
  return { setor, regime: reg.regime, horas: reg.horas, turnos, abertos, postos, postosPadrao: pp, necessidade, necessarioTurnos, necessarioHoras, necessario, equipe: pessoas.length, alocacao, contratacoes: n, salarioMedio, custo: n * salarioMedio * (1 + cfg.nova.encargos / 100), cobertura };
}
