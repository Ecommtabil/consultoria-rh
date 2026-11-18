import type { EscalaDados } from './tipos';
import { intervaloJanela } from './regime';
import { toMin } from './tempo';
export type Almoco = { ini: number; fim: number; manual: boolean } | null;
export function parseAlmoco(v: string | null | undefined, ref: number): { ini: number; fim: number } | null {
  if (!v) return null; const [a, b] = v.split('-'); let ini = toMin(a); let fim = toMin(b); if (Number.isNaN(ini) || Number.isNaN(fim)) return null;
  while (ini < ref - 60) { ini += 1440; } while (fim <= ini) fim += 1440; return { ini, fim };
}
export function duracaoAlmoco(janelaMin: number) { return intervaloJanela(janelaMin); }
/** Almoço automático por dia: minimiza sobreposição no setor; manuais ficam fixos. */
export function calcAlmocos(e: EscalaDados): Record<string, Almoco[]> {
  const out: Record<string, Almoco[]> = {}; for (const p of e.pessoas) out[p.id] = e.dias.map(() => null);
  const setores = [...new Set(e.pessoas.map(p => p.setor))];
  e.dias.forEach((_, di) => {
    for (const setor of setores) {
      const ps = e.pessoas.filter(p => p.setor === setor).map(p => ({ p, cel: e.grade[p.id]?.[di], jan: e.codigos[e.grade[p.id]?.[di]?.c ?? ''] })).filter(x => x.jan);
      const placed: { ini: number; fim: number }[] = [];
      for (const x of ps) { const m = parseAlmoco(x.cel?.alm, x.jan![0]); if (m) { out[x.p.id]![di] = { ...m, manual: true }; placed.push(m); } }
      for (const x of ps.filter(x => !out[x.p.id]![di]).sort((a, b) => a.jan![0] - b.jan![0])) {
        const [ini, fim] = x.jan!; const len = fim - ini; const dur = duracaoAlmoco(len); if (!dur) continue;
        const step = dur === 15 ? 15 : 30; let lo = Math.ceil((ini + 120) / step) * step; const hi = Math.min(fim - dur - 120, ini + 360);
        const cands: number[] = []; for (let t = lo; t <= hi; t += step) cands.push(t);
        if (!cands.length) { lo = Math.round(ini + (len - dur) / 2); cands.push(lo); }
        const meio = ini + (len - dur) / 2;
        const best = cands.map(t => ({ t, n: placed.filter(o => o.ini < t + dur && t < o.fim).length })).sort((a, b) => a.n - b.n || Math.abs(a.t - meio) - Math.abs(b.t - meio))[0]!;
        const a = { ini: best.t, fim: best.t + dur }; placed.push(a); out[x.p.id]![di] = { ...a, manual: false };
      }
    }
  });
  return out;
}
