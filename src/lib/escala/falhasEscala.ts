import type { EscalaDados } from './tipos';
import { diaSemana, fmt } from './tempo';
import type { Almoco } from './calcAlmocos';
export type FalhaSetor = { setor: string; postos: number; diasFalha: number; pessoaHora: number; top: { faixa: string; dias: number }[]; diasSoAlmoco: number; curva: { t: number; hora: string; media: number; pior: number; postos: number }[]; diasAnalisados: number };
export function presentes(e: EscalaDados, setor: string, di: number, t: number, almocos?: Record<string, Almoco[]>) {
  let n = 0; for (const p of e.pessoas) { if (p.setor !== setor) continue; const j = e.codigos[e.grade[p.id]?.[di]?.c ?? '']; if (!j) continue;
    if (j[0] <= t && t < j[1]) { const a = almocos?.[p.id]?.[di]; if (a && a.ini <= t && t < a.fim) continue; n++; } }
  return n;
}
export function falhasEscala(e: EscalaDados, almocos?: Record<string, Almoco[]>): FalhaSetor[] {
  return Object.entries(e.setores).map(([setor, s]) => {
    let diasFalha = 0, pessoaMin = 0, diasSoAlmoco = 0, analisados = 0; const faixas = new Map<string, number>(); const curvaMap = new Map<number, { soma: number; n: number; pior: number }>();
    e.dias.forEach((iso, di) => {
      if (!iso.startsWith(e.mes)) return; const h = s.horarios[diaSemana(iso)]; if (!h) return; analisados++;
      let falhaCom = false, falhaSem = false; let ini: number | null = null; const ranges: string[] = [];
      for (let t = h[0]; t < h[1]; t += 15) {
        const com = presentes(e, setor, di, t, almocos); const sem = presentes(e, setor, di, t);
        const c = curvaMap.get(t) ?? { soma: 0, n: 0, pior: Infinity }; c.soma += com; c.n++; c.pior = Math.min(c.pior, com); curvaMap.set(t, c);
        if (com < s.postos) { falhaCom = true; pessoaMin += (s.postos - com) * 15; }
        if (sem < s.postos) { falhaSem = true; if (ini === null) ini = t; } else if (ini !== null) { ranges.push(`${fmt(ini)}–${fmt(t)}`); ini = null; }
      }
      if (ini !== null) ranges.push(`${fmt(ini)}–${fmt(h[1])}`);
      ranges.forEach(r => faixas.set(r, (faixas.get(r) ?? 0) + 1));
      if (falhaCom || falhaSem) diasFalha++; if (falhaCom && !falhaSem) diasSoAlmoco++;
    });
    const top = [...faixas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([faixa, dias]) => ({ faixa, dias }));
    const curva = [...curvaMap.entries()].sort((a, b) => a[0] - b[0]).map(([t, c]) => ({ t, hora: fmt(t), media: Math.round((c.soma / c.n) * 10) / 10, pior: c.pior, postos: s.postos }));
    return { setor, postos: s.postos, diasFalha, pessoaHora: pessoaMin / 60, top, diasSoAlmoco, curva, diasAnalisados: analisados };
  });
}
