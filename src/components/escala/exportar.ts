import * as XLSX from 'xlsx';
import { DIAS_LONGO, diaSemana, ddmm, fmt, fmtH, semanas, totaisSemana, type EscalaDados, type Almoco } from '@/lib/escala';
export function legenda(e: EscalaDados) { return Object.entries(e.codigos).map(([c, [a, b]]) => `${c} = ${fmt(a)}–${fmt(b)}`); }
export function exportarEscala(e: EscalaDados, ids: string[], nome: string) {
  const head = ['Setor', 'Nome', ...e.dias.map(d => `${ddmm(d)} ${DIAS_LONGO[diaSemana(d)]}`)];
  const rows = e.pessoas.filter(p => ids.includes(p.id)).map(p => [p.setor, p.nome, ...(e.grade[p.id] ?? []).map(c => c.c)]);
  const b = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(b, XLSX.utils.aoa_to_sheet([head, ...rows]), 'Escala');
  XLSX.utils.book_append_sheet(b, XLSX.utils.aoa_to_sheet([['Código', 'Horário'], ...Object.entries(e.codigos).map(([c, [a, z]]) => [c, `${fmt(a)}–${fmt(z)}`]), ['F', 'Folga'], ['FE', 'Férias'], ['X', 'Setor fechado']]), 'Legenda');
  XLSX.writeFile(b, `Escala_${nome}_${e.mes}_${e.cenario}.xlsx`);
}
export function exportarAlmocos(e: EscalaDados, alm: Record<string, Almoco[]>, nome: string) {
  const b = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(b, XLSX.utils.aoa_to_sheet([['Setor', 'Nome', ...e.dias.map(ddmm)], ...e.pessoas.map(p => [p.setor, p.nome, ...e.dias.map((_, i) => { const a = alm[p.id]?.[i]; return a ? `${fmt(a.ini)}–${fmt(a.fim)}` : ''; })])]), 'Almoços');
  const f: unknown[][] = [['Semana', 'Nome', 'Dias', 'Folgas', 'Domingo', 'Férias', 'Situação']];
  semanas(e).forEach((s, w) => totaisSemana(e, w).forEach(t => f.push([`${ddmm(s[0]!)}–${ddmm(s[6]!)}`, t.nome, t.dias, t.folgas, t.domingo, t.ferias, t.situacao])));
  XLSX.utils.book_append_sheet(b, XLSX.utils.aoa_to_sheet(f), 'Folgas por semana');
  const c: unknown[][] = [['Data', 'Setor', 'Menor equipe no almoço', 'Postos']];
  e.dias.forEach((d, i) => Object.entries(e.setores).forEach(([s, st]) => { const h = st.horarios[diaSemana(d)]; if (!h) return; let min = Infinity; for (let t = h[0]; t < h[1]; t += 15) { const ps = e.pessoas.filter(p => p.setor === s); const n = ps.filter(p => { const j = e.codigos[e.grade[p.id]?.[i]?.c ?? '']; const a = alm[p.id]?.[i]; return j && j[0] <= t && t < j[1] && !(a && a.ini <= t && t < a.fim); }).length; if (ps.some(p => { const a = alm[p.id]?.[i]; return a && a.ini <= t && t < a.fim; })) min = Math.min(min, n); } if (min !== Infinity) c.push([ddmm(d), s, min, st.postos]); }));
  XLSX.utils.book_append_sheet(b, XLSX.utils.aoa_to_sheet(c), 'Cobertura no almoço');
  XLSX.writeFile(b, `Almocos_${nome}_${e.mes}.xlsx`);
}
export function exportarQuadro(e: EscalaDados, alm: Record<string, Almoco[]>, nome: string) {
  const b = XLSX.utils.book_new();
  semanas(e).forEach((s, w) => {
    const rows: unknown[][] = [['Dia', 'Nº', 'Nome', 'Setor', 'Entrada', 'Saída', 'Entrada', 'Saída']];
    s.forEach((d, k) => { const i = w * 7 + k; let n = 0; e.pessoas.forEach(p => { const c = e.grade[p.id]?.[i]?.c ?? 'X'; const j = e.codigos[c]; const a = alm[p.id]?.[i];
      rows.push([`${ddmm(d)} ${DIAS_LONGO[diaSemana(d)]}`, j ? ++n : '', p.nome, p.setor, j ? fmt(j[0]) : c === 'FE' ? 'FÉRIAS' : c === 'X' ? 'FECHADO' : 'FOLGA', j && a ? fmt(a.ini) : '', j && a ? fmt(a.fim) : '', j ? fmt(j[1]) : '']); }); });
    rows.push([]); rows.push(['Totais', '', 'Nome', 'Dias', 'Folgas', 'Horas', 'Carga', 'Saldo']);
    totaisSemana(e, w, alm).forEach(t => rows.push(['', '', t.nome, t.dias, t.folgas, fmtH(t.horas), fmtH(t.carga), t.saldo == null ? '—' : fmtH(t.saldo)]));
    XLSX.utils.book_append_sheet(b, XLSX.utils.aoa_to_sheet(rows), `Semana ${w + 1}`);
  });
  XLSX.writeFile(b, `Quadro_${nome}_${e.mes}.xlsx`);
}
