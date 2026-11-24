import type { Celula, Colab, EscalaConfig, EscalaDados, FeriasReg, Horario, SetorEsc } from './tipos';
import { diasTrabalho, jornadaDiaria } from './regime';
import { montarDia } from './montarDia';
import { horarioDia } from './operacao';
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
      // Folgas da semana distribuídas antes: cada folga vai para o dia com mais horas sobrando, para todo dia aberto ter cobertura.
      const folgaPlan = new Set<string>();
      {
        const jd = (i: number) => jornadaDiaria(M[i]!.p.horas, M[i]!.p.regime);
        const sobraDia = [0, 1, 2, 3, 4, 5, 6].map(d => { const h = horarios[d]; if (!h) return -Infinity; return M.reduce((s, m, i) => s + (disponivel(m, d, semana[d]!) && !(d === 5 && reservados.has(i)) ? jd(i) : 0), 0) - plano.postos * (h.fim - h.ini); });
        M.forEach((m, i) => {
          const domForc = st[i]!.N > 0 && st[i]!.dom >= st[i]!.N - 1 && disponivel(m, 6, semana[6]!) ? 1 : 0;
          let q = st[i]!.quota - (reservados.has(i) ? 1 : 0) - domForc;
          const fixas = [0, 1, 2, 3, 4, 5, 6].filter(d => horarios[d] && semana[d] && !disponivel(m, d, semana[d]!)).length; q -= fixas;
          while (q-- > 0) {
            const opts = [0, 1, 2, 3, 4, 5, 6].filter(d => semana[d] && disponivel(m, d, semana[d]!) && !folgaPlan.has(`${i}-${d}`) && !(d === 5 && (reservados.has(i) || escolhidos.has(i))) && !(d === 6 && domForc));
            if (!opts.length) break;
            const d = opts.sort((a, b) => sobraDia[b]! - sobraDia[a]! || ((a + i) % 7) - ((b + i) % 7))[0]!;
            folgaPlan.add(`${i}-${d}`); sobraDia[d] = sobraDia[d]! - jd(i);
          }
        });
      }
      const codSemana: (string)[][] = M.map(() => []); const almSemana: ([number, number] | undefined)[][] = M.map(() => []);
      // Máximo de 2 folgas por semana (dias com a empresa fechada contam como folga).
      const folgasSem = M.map(() => 0); const MAX_FOLGAS = 2;
      let diaAtual = 0;
      const podeFolgar = (i: number) => folgasSem[i]! + (reservados.has(i) && diaAtual < 5 ? 1 : 0) + (diaAtual < 6 && st[i]!.N > 0 && st[i]!.dom >= st[i]!.N - 1 && !!M[i]!.janelas[6] && M[i]!.janelas[6] !== 'folga' ? 1 : 0) < MAX_FOLGAS;
      for (let d = 0; d < 7; d++) {
        diaAtual = d; const iso = semana[d]!; const dec: (string | null)[] = M.map(() => null); const recorte = new Map<number, { ini: number; fim: number }>(); const almDia = new Map<number, [number, number]>();
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
          else if (folgaPlan.has(`${i}-${d}`) && podeFolgar(i) && livre(i) > 0) dec[i] = 'F';
          else if (podeFolgar(i) && livre(i) > 0 && livre(i) >= restantes(i) && !(d === 5 && escolhidos.has(i))) dec[i] = 'F';
        });
        const cands = M.map((_, i) => i).filter(i => dec[i] === null && livre(i) > 0 && !(d === 5 && escolhidos.has(i)))
          .sort((a, b) => (livre(b) / Math.max(1, restantes(b)) + st[b]!.consec) - (livre(a) / Math.max(1, restantes(a)) + st[a]!.consec) || a - b);
        // Folga extra só para quem sobra: as horas de quem fica ainda cobrem todos os postos do dia.
        const hd = horarios[d]; const precisa = hd ? plano.postos * (hd.fim - hd.ini) : 0;
        const trabDe = (i: number) => jornadaDiaria(M[i]!.p.horas, M[i]!.p.regime);
        let capacidade = M.reduce((s, _, i) => s + (dec[i] === null ? trabDe(i) : 0), 0);
        for (const i of cands) if (podeFolgar(i) && capacidade - trabDe(i) >= precisa) { dec[i] = 'F'; capacidade -= trabDe(i); }
        if (hd) {
          const prefDe = (i: number) => { const j = M[i]!.janelas[d]; return j && j !== 'folga' ? j.ini : 9999; };
          const dia = montarDia(hd.ini, hd.fim, plano.postos || 1, M.map((_, i) => i).filter(i => dec[i] === null).map(i => ({ idx: i, trab: trabDe(i), pref: prefDe(i) })));
          for (const t of dia.turnos) { recorte.set(t.idx, { ini: t.ini, fim: t.fim }); if (t.alm) almDia.set(t.idx, t.alm); }
          for (const i of dia.sobra) { dec[i] = 'F'; if (!podeFolgar(i)) avisos.push(`${M[i]!.p.nome}, ${ddmm(iso)}: sem posto livre — mais pessoas que postos no setor ${setor}`); }
        }
        M.forEach((m, i) => {
          const s = st[i]!; const r = dec[i] ?? null;
          if (r === null) { const j = recorte.get(i) ?? (m.janelas[d] as { ini: number; fim: number }); codSemana[i]![d] = `${j.ini}-${j.fim}`; const al = almDia.get(i); if (al) almSemana[i]![d] = al; s.consec++; if (d === 6) s.dom++; if (d === 5) s.sabSem = 0; }
          else { codSemana[i]![d] = r; s.consec = 0; if (r === 'F' || r === 'X') folgasSem[i]!++; if (r !== 'X' && s.quota > 0) s.quota--; if (r === 'F' && d === 5 && reservados.has(i)) reservados.delete(i); if (d === 6) s.dom = 0; if (d === 5) s.sabSem++; }
        });
      }
      M.forEach((m, i) => {
        const jan: Horario[] = codSemana[i]!.map(k => { const p = /^(-?\d+)-(\d+)$/.exec(k); return p ? { ini: Number(p[1]), fim: Number(p[2]) } : null; });
        if (plano.completar && !codSemana[i]!.includes('FE')) {
          const faltaReal = Math.max(0, m.p.horas * 60 - jan.reduce((s, h, d) => { const al = almSemana[i]![d]; return s + (h ? h.fim - h.ini - (al ? al[1] - al[0] : 0) : 0); }, 0));
          if (faltaReal > 0) avisos.push(`${m.p.nome}, semana de ${ddmm(semana[0]!)}: faltam ${fmtH(faltaReal)} para as ${m.p.horas}h (sem posto livre para mais horas)`);
        }
        codSemana[i]!.forEach((k, d) => { const h = jan[d]; const al = almSemana[i]![d]; grade[m.p.id]!.push(h ? (al ? { c: novoCodigo(codigos, h.ini, h.fim), ag: al } : { c: novoCodigo(codigos, h.ini, h.fim) }) : { c: k }); });
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
