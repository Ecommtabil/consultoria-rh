import { intervaloTrabalho } from './regime';
export type PessoaDia = { idx: number; trab: number; pref: number };
export type TurnoDiaMontado = { idx: number; ini: number; fim: number; alm: [number, number] | null };
export type DiaMontado = { turnos: TurnoDiaMontado[]; sobra: number[]; descoberto: number; almocoSemCobertura: number };
const MIN_TURNO = 240;
/**
 * Monta um dia do setor em "faixas" (uma por posto): na mesma faixa só há uma pessoa trabalhando por vez,
 * então nunca há mais pessoas que postos. Duplas se cobrem no almoço: a 1ª sai para almoçar quando a 2ª chega
 * e a 2ª almoça enquanto a 1ª termina o turno. Quem sobra no dia fica em `sobra`.
 */
export function montarDia(abre: number, fecha: number, postos: number, pessoas: PessoaDia[]): DiaMontado {
  const L = fecha - abre; const P = Math.max(0, Math.floor(postos));
  if (L <= 0 || P === 0) return { turnos: [], sobra: pessoas.map(p => p.idx), descoberto: 0, almocoSemCobertura: 0 };
  const ord = [...pessoas].sort((a, b) => a.pref - b.pref || a.idx - b.idx);
  const faixas: PessoaDia[][] = Array.from({ length: P }, () => []); const soma = Array<number>(P).fill(0);
  for (const p of [...ord].sort((a, b) => b.trab - a.trab || a.pref - b.pref || a.idx - b.idx)) {
    let k = 0; for (let f = 1; f < P; f++) if (soma[f]! < soma[k]!) k = f;
    faixas[k]!.push(p); soma[k] = soma[k]! + p.trab;
  }
  const turnos: TurnoDiaMontado[] = []; const sobra: number[] = []; let descoberto = 0; let almocoSemCobertura = 0;
  for (const f0 of faixas) {
    let f = f0.sort((a, b) => a.pref - b.pref || a.idx - b.idx);
    while (f.length * MIN_TURNO > L && f.length) { const fora = f.reduce((m, p) => (p.trab < m.trab ? p : m)); sobra.push(fora.idx); f = f.filter(p => p !== fora); }
    const total = f.reduce((s, p) => s + p.trab, 0);
    let w = f.map(p => p.trab);
    if (total > L) {
      // Número ímpar de pessoas: a última fica com turno de até 4h (sem intervalo), para não deixar almoço descoberto.
      const n = f.length; const ultimo = f[n - 1]!; const impar = n % 2 === 1 && n > 1 && intervaloTrabalho(ultimo.trab) > 0;
      const resto0 = total - ultimo.trab;
      if (impar && resto0 >= L - MIN_TURNO) { const base = L - MIN_TURNO; w = f.map((p, k) => (k === n - 1 ? MIN_TURNO : Math.max(MIN_TURNO, Math.floor((p.trab * base) / resto0 / 15) * 15))); }
      else w = f.map(p => Math.max(MIN_TURNO, Math.floor((p.trab * L) / total / 15) * 15));
      let resto = L - w.reduce((s, x) => s + x, 0);
      for (let i = 0; resto !== 0 && i < 4 * w.length; i++) { const k = i % (impar && resto0 >= L - MIN_TURNO ? Math.max(1, w.length - 1) : w.length); const d = resto > 0 ? Math.min(resto, f[k]!.trab - w[k]!) : Math.max(resto, MIN_TURNO - w[k]!); w[k] = w[k]! + d; resto -= d; }
    }
    let t = abre; let i = 0;
    while (i < f.length) {
      const wA = w[i]!; const lA = intervaloTrabalho(wA);
      if (!lA) { turnos.push({ idx: f[i]!.idx, ini: t, fim: t + wA, alm: null }); t += wA; i++; continue; }
      const wB = w[i + 1]; const lB = wB !== undefined ? intervaloTrabalho(wB) : 0;
      if (wB !== undefined && lB > 0 && wA - lB >= 60 && wB - lA >= 60) {
        const a1 = wA - lB; const ent = t + a1;
        turnos.push({ idx: f[i]!.idx, ini: t, fim: t + wA + lA, alm: [ent, ent + lA] });
        turnos.push({ idx: f[i + 1]!.idx, ini: ent, fim: t + wA + wB, alm: [ent + lA, ent + lA + lB] });
        t += wA + wB; i += 2; continue;
      }
      // Sem dupla para cobrir o almoço: o intervalo fica descoberto.
      const fim = Math.min(fecha, t + wA + lA); const ai = t + Math.min(Math.max(120, Math.round(wA / 2 / 15) * 15), Math.max(0, fim - t - lA - 60));
      turnos.push({ idx: f[i]!.idx, ini: t, fim, alm: [ai, ai + lA] }); almocoSemCobertura += lA; descoberto += lA; t = fim; i++;
    }
    descoberto += Math.max(0, fecha - t);
  }
  return { turnos, sobra, descoberto, almocoSemCobertura };
}
