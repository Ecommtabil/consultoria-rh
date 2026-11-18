import type { Cliente } from '@/lib/governanca';
import { faixa, assinaturas, cartoes, finalizar, novoPdf, paragrafo, secao, tabela, GELO, type Pdf } from '@/lib/pdf';
import { ddmes, ddmm, diaSemana, DIAS_LONGO, ehTrabalho, fmt, fmtH, semanas, totaisSemana, type Almoco, type EscalaConfig, type EscalaDados } from '@/lib/escala';
export type OpcoesQuadro = { escopo: 'semana' | 'mes'; resumo: boolean; totais: boolean; alertas: boolean; assinaturas: boolean };
type Alertas = (e: EscalaDados, w: number, alm: Record<string, Almoco[]>) => string[];
export function relatorioQuadro(cliente: Cliente, cfg: EscalaConfig, e: EscalaDados, alm: Record<string, Almoco[]>, w0: number, o: OpcoesQuadro, alertas: Alertas) {
  const ws = o.escopo === 'mes' ? semanas(e).map((_, i) => i) : [w0]; let p: Pdf | null = null;
  const setores = Object.keys(e.setores).join(', ');
  for (const w of ws) {
    const sem = semanas(e)[w]!; const linhas = [`Funcionamento ${cfg.empresa.abre}–${cfg.empresa.fecha} · Semana ${ddmm(sem[0]!)} a ${ddmm(sem[6]!)}`, `Cenário: ${e.cenario === 'nova' ? 'Nova jornada' : 'Jornada atual'} · Setor: ${setores || '—'}`];
    if (!p) p = novoPdf('Quadro semanal de horários', cliente, linhas); else { p.doc.addPage(); p.y = faixa(p.doc, 'Quadro semanal de horários', cliente, linhas); }
    const tot = totaisSemana(e, w, alm);
    if (o.resumo) cartoes(p, [['Pessoas', String(e.pessoas.length)], ['Dias trabalhados', String(tot.reduce((s, t) => s + t.dias, 0))], ['Folgas', String(tot.reduce((s, t) => s + t.folgas, 0))], ['Horas trabalhadas', fmtH(tot.reduce((s, t) => s + t.horas, 0))]]);
    const body: (string | number | { content: string; rowSpan?: number; colSpan?: number; styles?: Record<string, unknown> })[][] = [];
    sem.forEach((d, k) => { const i = w * 7 + k; const dom = diaSemana(d) === 6; const fill = dom ? [226, 232, 240] : GELO; const trab = e.pessoas.filter(x => ehTrabalho(e.grade[x.id]?.[i]?.c ?? 'X')); const resto = e.pessoas.filter(x => !trab.includes(x));
      const span = Math.max(1, trab.length) + 1; const dia = { content: `${ddmes(d)}\n${DIAS_LONGO[diaSemana(d)]}`, rowSpan: span, styles: { fillColor: fill, fontStyle: 'bold', valign: 'middle' } }; let min = 0;
      if (!trab.length) body.push([dia, { content: Object.values(e.setores).every(s => !s.horarios[diaSemana(d)]) ? 'FECHADO' : 'Ninguém trabalhando', colSpan: 7, styles: { fontStyle: 'bold', halign: 'center' } }]);
      trab.forEach((x, n) => { const c = e.grade[x.id]![i]!; const j = e.codigos[c.c]!; const a = alm[x.id]?.[i]; min += j[1] - j[0] - (a ? a.fim - a.ini : 0); const row = [n + 1, x.nome, x.setor, fmt(j[0]), a ? `${fmt(a.ini)}${a.manual ? '*' : ''}` : '—', a ? `${fmt(a.fim)}${a.manual ? '*' : ''}` : '—', fmt(j[1])]; body.push(n === 0 ? [dia, ...row] : row); });
      body.push([{ content: `${resto.map(x => `${x.nome}: ${e.grade[x.id]?.[i]?.c === 'FE' ? 'FÉRIAS' : e.grade[x.id]?.[i]?.c === 'X' ? 'FECHADO' : dom ? 'FOLGA (domingo)' : 'FOLGA'}`).join(' · ')}${resto.length ? '\n' : ''}Total do dia: ${trab.length} trabalhando · ${resto.length} sem trabalho · ${fmtH(min)} trabalhadas`, colSpan: 7, styles: { fontSize: 7, textColor: [71, 85, 105] } }]); });
    secao(p, 'Quadro da semana'); tabela(p, { head: [['Dia', 'Nº', 'Nome', 'Setor', 'Entrada', 'Saída', 'Entrada', 'Saída']], body: body as never, alternateRowStyles: {} });
    if (o.totais) { secao(p, 'Totais por funcionário'); tabela(p, { head: [['Nome', 'Dias', 'Folgas', 'Domingo', 'Férias', 'Horas', 'Carga', 'Saldo', 'Situação']], body: tot.map(t => [t.nome, t.dias, t.folgas, t.domingo, t.ferias, fmtH(t.horas), fmtH(t.carga), t.saldo == null ? '—' : fmtH(t.saldo), t.situacao]) }); }
    if (o.alertas) { secao(p, 'Alertas'); const al = alertas(e, w, alm); paragrafo(p, al.length ? al.map(a => `• ${a}`).join('\n') : 'Nenhum alerta nesta semana.'); }
    if (o.assinaturas) assinaturas(p, ['Responsável pela escala', 'Gestor/Empregador']);
    p.doc.setFontSize(7); p.doc.text('* almoço ajustado manualmente', 14, Math.min(282, p.y));
  }
  if (p) finalizar(p, `Quadro_${cliente.nome.replace(/\W+/g, '_')}_${e.mes}${o.escopo === 'semana' ? `_semana${w0 + 1}` : ''}.pdf`);
}
