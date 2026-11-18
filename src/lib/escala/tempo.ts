const pad = (n: number) => String(n).padStart(2, '0');
export function toMin(h: string | null | undefined): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(h ?? '').trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
}
export function fmt(min: number): string { const m = ((Math.round(min) % 1440) + 1440) % 1440; return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; }
export function fmtH(min: number): string { const m = Math.round(Math.abs(min)); return `${min < 0 ? '−' : ''}${Math.floor(m / 60)}h${pad(m % 60)}`; }
export function janela(abre: string | null | undefined, fecha: string | null | undefined) {
  const ini = toMin(abre); let fim = toMin(fecha);
  if (Number.isNaN(ini) || Number.isNaN(fim)) return null;
  if (fim <= ini) fim += 1440;
  return { ini, fim };
}
export const addDias = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const diaSemana = (iso: string) => (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
export const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const ddmes = (iso: string) => `${iso.slice(8, 10)}/${MESES[Number(iso.slice(5, 7)) - 1]}`;
/** Semanas completas (seg–dom) que contêm o mês. */
export function diasDoMes(mes: string): string[] {
  const first = `${mes}-01`; const [y, m] = mes.split('-').map(Number);
  const last = new Date(Date.UTC(y!, m!, 0)).toISOString().slice(0, 10);
  const ini = addDias(first, -diaSemana(first)); const fim = addDias(last, 6 - diaSemana(last));
  const out: string[] = []; for (let d = ini; d <= fim; d = addDias(d, 1)) out.push(d); return out;
}
