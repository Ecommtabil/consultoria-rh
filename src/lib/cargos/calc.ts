import { numberBR, normalize } from '@/lib/governanca';
export type Trilha = 'Técnica' | 'Gestão';
export type CargoLinha = { id?: string; familia: string | null; cargo: string | null; nivel: number | null; trilha: string | null; salario_base: number | null; tempo_minimo_meses: number | null; requisitos: string | null; ordem?: number | null };
export const letra = (k: number) => String.fromCharCode(65 + k);
export const letras = (n: number) => Array.from({ length: n }, (_, k) => letra(k));
const cent = (v: number) => Math.round(v * 100) / 100;
/** Salário do step k = base × (1 + %)^k, em centavos. */
export const steps = (base: number, n: number, pct: number) => Array.from({ length: Math.max(1, n) }, (_, k) => cent(base * (1 + pct / 100) ** k));
/** Amplitude da faixa = (1 + %)^(steps − 1) − 1. */
export const amplitude = (n: number, pct: number) => (1 + pct / 100) ** (Math.max(1, n) - 1) - 1;
export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const pctBR = (v: number) => `${(v * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
export type GerarFamilia = { familia: string; cargo: string; base: number; niveis: number; pct: number; trilha: Trilha };
export function gerarFamilia(g: GerarFamilia, existentes: CargoLinha[]): CargoLinha[] {
  const n = Math.min(10, Math.max(1, Math.floor(g.niveis)));
  const ini = Math.max(0, ...existentes.filter(c => normalize(c.familia) === normalize(g.familia)).map(c => c.nivel ?? 0));
  let sal = g.base;
  return Array.from({ length: n }, (_, i) => { if (i) sal = cent(sal * (1 + g.pct / 100));
    return { familia: g.familia.trim(), cargo: n === 1 ? g.cargo.trim() : `${g.cargo.trim()} ${ROM[i]}`, nivel: ini + i + 1, trilha: g.trilha, salario_base: cent(sal), tempo_minimo_meses: i ? 12 : 0, requisitos: '' }; });
}
export const parseSalario = (v: unknown) => numberBR(v);
export const trilhaDe = (v: unknown): Trilha => (normalize(v).includes('gest') ? 'Gestão' : 'Técnica');
export type Grupo = { familia: string; cargos: CargoLinha[] };
export function porFamilia(cs: CargoLinha[]): Grupo[] {
  const m = new Map<string, CargoLinha[]>();
  for (const c of cs) { const f = c.familia?.trim() || 'Sem família'; m.set(f, [...(m.get(f) ?? []), c]); }
  return [...m].map(([familia, cargos]) => ({ familia, cargos: [...cargos].sort((a, b) => (a.nivel ?? 0) - (b.nivel ?? 0) || (a.ordem ?? 0) - (b.ordem ?? 0)) }));
}
export function alertas(cs: CargoLinha[]): string[] {
  const out: string[] = [];
  for (const c of cs) if (!c.salario_base) out.push(`“${c.cargo || 'Cargo sem nome'}” está sem salário.`);
  for (const g of porFamilia(cs)) g.cargos.forEach((c, i) => { const menores = g.cargos.slice(0, i).filter(x => (x.nivel ?? 0) < (c.nivel ?? 0) && (x.salario_base ?? 0) > (c.salario_base ?? 0));
    if (c.salario_base && menores.length) out.push(`“${c.cargo}” (nível ${c.nivel}) começa abaixo de “${menores[0]!.cargo}” (nível ${menores[0]!.nivel}) na família ${g.familia}.`); });
  return out;
}
const COLS: Record<string, string[]> = { familia: ['familia'], cargo: ['cargo', 'funcao'], nivel: ['nivel'], trilha: ['trilha'], salario_base: ['salariobase', 'salario'], tempo_minimo_meses: ['tempominimomeses', 'tempominimo', 'tempo'], requisitos: ['requisitos', 'requisito'] };
export type Importado = { linhas: CargoLinha[]; avisos: { linha: number; texto: string }[] };
export function parseCargosPlanilha(rows: unknown[][]): Importado {
  const k = (v: unknown) => normalize(v).replace(/[^a-z0-9]/g, '');
  const head = (rows[0] ?? []).map(k); const col: Record<string, number> = {};
  for (const [c, al] of Object.entries(COLS)) { const i = head.findIndex(h => al.includes(h)); if (i >= 0) col[c] = i; }
  if (col['cargo'] === undefined) throw new Error('Coluna “Cargo” não encontrada na planilha.');
  const linhas: CargoLinha[] = []; const avisos: Importado['avisos'] = [];
  rows.slice(1).forEach((r, i) => { const g = (c: string) => (col[c] === undefined ? '' : r[col[c]!] ?? ''); const cargo = String(g('cargo')).trim(); if (!cargo) return; const L = i + 2;
    let sal: number | null = null; if (String(g('salario_base')).trim()) { try { sal = parseSalario(g('salario_base')); } catch { avisos.push({ linha: L, texto: `Salário inválido (“${String(g('salario_base'))}”)` }); } } else avisos.push({ linha: L, texto: 'Sem salário base' });
    const nv = Number(g('nivel')); const tm = Number(g('tempo_minimo_meses'));
    if (String(g('nivel')).trim() && !Number.isFinite(nv)) avisos.push({ linha: L, texto: 'Nível inválido' });
    if (!String(g('familia')).trim()) avisos.push({ linha: L, texto: 'Sem família' });
    linhas.push({ familia: String(g('familia')).trim() || null, cargo, nivel: Number.isFinite(nv) && nv > 0 ? Math.round(nv) : 1, trilha: trilhaDe(g('trilha')), salario_base: sal, tempo_minimo_meses: Number.isFinite(tm) ? Math.round(tm) : 0, requisitos: String(g('requisitos')).trim() || null }); });
  return { linhas, avisos };
}
