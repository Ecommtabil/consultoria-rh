import type { Celula, Colab, EscalaConfig, EscalaDados, FeriasReg, Horario, SetorEsc } from './tipos';
import { diasTrabalho } from './regime';
import { horarioDia } from './operacao';
import { completarCarga } from './completarCarga';
import { planoSetor, setorDe, type Membro } from './planoSetor';
import type { Dimensionamento } from './dimensionarSetor';
import { ddmm, diasDoMes, fmtH } from './tempo';
const LETRAS = 'ABCDEGHIJKLMNOPQRSTUVWYZ'.split('');
export function novoCodigo(codigos: Record<string, [number, number]>, ini: number, fim: number) {
  const hit = Object.entries(codigos).find(([, v]) => v[0] === ini && v[1] === fim); if (hit) return hit[0];
  const n = Object.keys(codigos).length; const c = n < LETRAS.length ? LETRAS[n]! : `${LETRAS[n % LETRAS.length]}${Math.floor(n / LETRAS.length) + 1}`;
  codigos[c] = [ini, fim]; return c;
}
export const ehTrabalho = (c: string) => c !== 'F' && c !== 'FE' && c !== 'X';
export type EntradaEscala = { cfg: EscalaConfig; colabs: Colab[]; ferias: FeriasReg[]; mes: string; cenario: 'atual' | 'nova'; contratar?: boolean; dims?: Record<string, Dimensionamento>; setores?: string[] };
export function gerarEscala(inp: EntradaEscala): EscalaDados {
  const dias = diasDoMes(inp.mes); const codigos: Record<string, [number, number]> = {}; const grade: Record<string, Celula[]> = {};
  const pessoas: EscalaDados['pessoas'] = []; const setores: Record<string, SetorEsc> = {}; const avisos: string[] = [];
  const porSetor = new Map<string, Colab[]>(); for (const c of inp.colabs) { const s = setorDe(c); porSetor.set(s, [...(porSetor.get(s) ?? []), c]); }
  const emFerias = (id: string, iso: string) => inp.ferias.some(f => f.colaborador_id === id && f.inicio <= iso && iso <= f.fim);
  for (const [setor, colabs] of [...porSetor.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (inp.setores && !inp.setores.includes(setor)) continue;
    const plano = planoSetor(inp.cfg, setor, colabs, inp.cenario, { contratar: inp.contratar, dim: inp.dims?.[setor] });
    const horarios = [0, 1, 2, 3, 4, 5, 6].map(d => horarioDia(plano.sc, d));
    setores[setor] = { postos: plano.postos, horarios: horarios.map(h => (h ? [h.ini, h.fim] : null)), completar: plano.completar };
    const M = plano.membros; const st = M.map((m, i) => {
      const N0 = plano.domingo || 0; const N = m.p.sexo === 'F' ? (N0 ? Math.min(N0, 2) : 2) : N0;
      return { consec: 0, N, dom: N ? i % N : 0, sabSem: M.length - i, quota: 0 };
    });
    M.forEach(m => { pessoas.push(m.p); grade[m.p.id] = []; });
    const disponivel = (m: Membro, d: number, iso: string) => { const j = m.janelas[d]; return !!j && j !== 'folga' && !emFerias(m.p.id, iso); };
    for (let w = 0; w * 7 < dias.length; w++) {
      const semana = dias.slice(w * 7, w * 7 + 7); const fechados = horarios.filter(h => !h).length;
      st.forEach((s, i) => { s.quota = Math.max(0, 7 - diasTrabalho(M[i]!.p.regime) - fechados); });
      const escolhidos = new Set<number>(); const reservados = new Set<number>();
      if (plano.rodizio !== null && horarios[5]) {
        const cands = M.map((m, i) => i).filter(i => disponivel(M[i]!, 5, semana[5]!));
        const needSat = plano.needDia[5]!.reduce((a, b) => a + b, 0);
        const nTrab = Math.min(cands.length, plano.rodizio > 0 ? Math.max(needSat, Math.ceil(cands.length / plano.rodizio)) : needSat);
        const viavel = (i: number) => st[i]!.quota >= 1 && [0, 1, 2, 3, 4].some(d => { const m = M[i]!; if (!disponivel(m, d, semana[d]!)) return false; const g = m.grupoDia[d]!; return M.filter(o => o.grupoDia[d] === g && disponivel(o, d, semana[d]!)).length > (plano.needDia[d]![g] ?? 0); });
        const ord = [...cands].sort((a, b) => Number(viavel(b)) - Number(viavel(a)) || st[b]!.sabSem - st[a]!.sabSem || a - b);
        ord.slice(0, nTrab).forEach(i => escolhidos.add(i)); ord.slice(nTrab).forEach(i => { if (st[i]!.quota >= 1) reservados.add(i); });
      }
      const codSemana: (string)[][] = M.map(() => []);
      for (let d = 0; d < 7; d++) {
        const iso = semana[d]!; const dec: (string | null)[] = M.map(() => null);
        const restantes = (i: number) => { let n = 0; for (let dd = d; dd < 7; dd++) if (disponivel(M[i]!, dd, semana[dd]!) && !(reservados.has(i) && dd === 5)) n++; return n; };
        const livre = (i: number) => st[i]!.quota - (reservados.has(i) && d <= 5 ? 1 : 0);
        M.forEach((m, i) => {
          const s = st[i]!; const j = m.janelas[d];
          if (!j) dec[i] = 'X';
          else if (emFerias(m.p.id, iso)) dec[i] = 'FE';
          else if (j === 'folga') dec[i] = 'F';
          else if (d === 5 && reservados.has(i)) dec[i] = 'F';
          else if (s.consec >= 6) dec[i] = 'F';
          else if (d === 6 && s.N > 0 && s.dom >= s.N - 1) dec[i] = 'F';
          else if (livre(i) > 0 && livre(i) >= restantes(i) && !(d === 5 && escolhidos.has(i))) dec[i] = 'F';
        });
        const cands = M.map((_, i) => i).filter(i => dec[i] === null && livre(i) > 0 && !(d === 5 && escolhidos.has(i)))
          .sort((a, b) => (livre(b) / Math.max(1, restantes(b)) + st[b]!.consec) - (livre(a) / Math.max(1, restantes(a)) + st[a]!.consec) || a - b);
        for (const i of cands) {
          const g = M[i]!.grupoDia[d]!; const trabalhando = M.filter((o, k) => o.grupoDia[d] === g && dec[k] === null).length;
          if (trabalhando - 1 >= (plano.needDia[d]![g] ?? 0)) dec[i] = 'F';
        }
        M.forEach((m, i) => {
          const s = st[i]!; const r = dec[i] ?? null;
          if (r === null) { const j = m.janelas[d] as { ini: number; fim: number }; codSemana[i]![d] = `${j.ini}-${j.fim}`; s.consec++; if (d === 6) s.dom++; if (d === 5) s.sabSem = 0; }
          else { codSemana[i]![d] = r; s.consec = 0; if (r !== 'X' && s.quota > 0) s.quota--; if (r === 'F' && d === 5 && reservados.has(i)) reservados.delete(i); if (d === 6) s.dom = 0; if (d === 5) s.sabSem++; }
        });
      }
      M.forEach((m, i) => {
        let jan: Horario[] = codSemana[i]!.map(k => { const p = /^(-?\d+)-(\d+)$/.exec(k); return p ? { ini: Number(p[1]), fim: Number(p[2]) } : null; });
        if (plano.completar && !codSemana[i]!.includes('FE')) {
          const r = completarCarga(jan, horarios, m.p.horas * 60); jan = r.janelas;
          if (r.falta > 0) avisos.push(`${m.p.nome}, semana de ${ddmm(semana[0]!)}: faltam ${fmtH(r.falta)} para as ${m.p.horas}h`);
        }
        codSemana[i]!.forEach((k, d) => { const h = jan[d]; grade[m.p.id]!.push({ c: h ? novoCodigo(codigos, h.ini, h.fim) : k }); });
      });
    }
  }
  return { versao: 2, mes: inp.mes, cenario: inp.cenario, geradaEm: new Date().toISOString(), dias, pessoas, codigos, grade, setores, avisos };
}
/** Abre escalas salvas em versões antigas (sem dias vizinhos ou campos novos). */
export function normalizarEscala(raw: unknown): EscalaDados | null {
  if (!raw || typeof raw !== 'object') return null; const r = raw as Partial<EscalaDados>; if (!r.mes || !r.grade) return null;
  let dias = r.dias; if (!dias?.length) { const all = diasDoMes(r.mes); dias = all.filter(d => d.startsWith(r.mes!)); }
  return { versao: 2, mes: r.mes, cenario: r.cenario ?? 'atual', geradaEm: r.geradaEm ?? '', dias, pessoas: r.pessoas ?? [], codigos: r.codigos ?? {}, grade: r.grade, setores: r.setores ?? {}, avisos: r.avisos ?? [] };
}
