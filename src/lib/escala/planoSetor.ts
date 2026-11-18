import type { Colab, EscalaConfig, Horario, PessoaEsc, Regime } from './tipos';
import { SEM_SETOR } from './tipos';
import { diasTrabalho, regimePessoa, turnoRelogio } from './regime';
import { horarioBase, horarioDia, minutos, setorCfg, type SetorResolvido } from './operacao';
import { dimensionarSetor, turnosPorDia, type Dimensionamento } from './dimensionarSetor';
import { janela } from './tempo';
export type Janela = Horario | 'folga';
export type Membro = { p: PessoaEsc; janelas: Janela[]; grupoDia: number[] };
export type Plano = { setor: string; sc: SetorResolvido; postos: number; membros: Membro[]; needDia: number[][]; completar: boolean; rodizio: number | null; sabCurto: boolean; domingo: number };
export const setorDe = (c: Colab) => (c.setor ?? '').trim() || SEM_SETOR;
export function janelasProprias(c: Colab, sc: SetorResolvido, regime: Regime, horas: number): Janela[] {
  const base = horarioBase(sc); const rel = Math.round(turnoRelogio(horas, regime));
  const util: Horario = janela(c.entrada, c.saida) ?? (base ? { ini: base.ini, fim: Math.min(base.fim, base.ini + rel) } : null);
  return [0, 1, 2, 3, 4, 5, 6].map(d => {
    if (!horarioDia(sc, d)) return null;
    const modo = d === 5 ? c.sab_modo : d === 6 ? c.dom_modo : 'igual';
    if (modo === 'folga') return 'folga';
    if (modo === 'diferente') return janela(d === 5 ? c.sab_entrada : c.dom_entrada, d === 5 ? c.sab_saida : c.dom_saida) ?? util;
    return util;
  });
}
export function planoSetor(cfg: EscalaConfig, setor: string, colabs: Colab[], cenario: 'atual' | 'nova', opts: { contratar?: boolean | undefined; dim?: Dimensionamento | undefined } = {}): Plano {
  const sc = setorCfg(cfg, setor); const base = horarioBase(sc); const sab = horarioDia(sc, 5);
  const sabCurto = !!(sab && base && minutos(sab) < minutos(base)); const completar = !!sc.completarCarga;
  const rodizio = sc.rodizioSab ? sc.rodizioSab : sabCurto && completar ? 0 : null;
  const abertos = [0, 1, 2, 3, 4, 5, 6].filter(d => horarioDia(sc, d)).length || 1;
  const membros: Membro[] = []; let needDia: number[][];
  const dim = opts.dim ?? dimensionarSetor(cfg, setor, colabs); const postos = dim.postos;
  const fixas = (c: Colab | undefined, j: Janela[]) => j.map((v, d) => (c && v && ((d === 5 && c.sab_modo === 'folga') || (d === 6 && c.dom_modo === 'folga')) ? 'folga' : v));
  if (cenario === 'nova') {
    const contratar = (opts.contratar ?? true) && !sc.semContratar; const T = dim.turnos.length;
    for (const a of dim.alocacao) {
      if (a.contratacao && !contratar) continue; const c = colabs.find(x => x.id === a.id);
      const r = c ? regimePessoa(c, cfg, setor, 'nova') : { regime: a.regime, horas: a.horas, manter: false };
      const grupoDia = [0, 1, 2, 3, 4, 5, 6].map(d => Math.max(0, Math.min(a.turno, turnosPorDia(dim.turnos, d) - 1)));
      const janelas: Janela[] = c && r.manter ? janelasProprias(c, sc, r.regime, r.horas) : grupoDia.map((g, d) => (T ? dim.turnos[g]![d] ?? null : null));
      membros.push({ p: { id: a.id ?? `novo-${setor}-${a.nome}`, nome: c?.nome || a.nome, setor, sexo: c?.sexo ?? null, regime: r.regime, horas: r.horas, grupo: a.turno, contratacao: a.contratacao || undefined }, janelas: fixas(c, janelas), grupoDia });
    }
    needDia = [0, 1, 2, 3, 4, 5, 6].map(d => Array.from({ length: Math.max(T, 1) }, (_, g) => (dim.turnos[g]?.[d] ? postos : 0)));
  } else {
    const chaves: string[] = []; const somaDias: number[] = [];
    for (const c of [...colabs].sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? ''))) {
      const r = regimePessoa(c, cfg, setor, 'atual'); const janelas = janelasProprias(c, sc, r.regime, r.horas);
      const util = janelas.find((j, d) => d < 5 && j && j !== 'folga') ?? janelas.find(j => j && j !== 'folga');
      const key = util && util !== 'folga' ? `${util.ini}-${util.fim}` : '-'; let g = chaves.indexOf(key); if (g < 0) { g = chaves.length; chaves.push(key); somaDias.push(0); }
      somaDias[g] = somaDias[g]! + Math.min(diasTrabalho(r.regime), abertos);
      membros.push({ p: { id: c.id, nome: c.nome ?? '', setor, sexo: c.sexo, regime: r.regime, horas: r.horas, grupo: g }, janelas: fixas(c, janelas), grupoDia: Array(7).fill(g) });
    }
    const need = somaDias.map(s => Math.max(1, Math.floor(s / abertos)));
    needDia = [0, 1, 2, 3, 4, 5, 6].map(d => need.map((n, g) => (membros.some(m => m.p.grupo === g && m.janelas[d] && m.janelas[d] !== 'folga') ? n : 0)));
  }
  return { setor, sc, postos, membros, needDia, completar, rodizio, sabCurto, domingo: cfg.nova.domingo };
}
