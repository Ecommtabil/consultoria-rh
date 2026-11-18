import type { Cliente } from '@/lib/governanca';
import { cartoes, finalizar, novoPdf, paragrafo, secao, tabela, quebra, AZUL2, CINZA } from '@/lib/pdf';
import { fmtH, type EscalaConfig } from '@/lib/escala';
import { analisar, faixa, resumoTurnos, viabilidadeTexto } from './analise';
import type { Analise } from './analise';
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export function relatorioDimensionamento(cliente: Cliente, cfg: EscalaConfig, a: Analise, mes: string) {
  const sc = cfg.empresa; const p = novoPdf('Relatório de dimensionamento', cliente, [`Funcionamento ${sc.abre}–${sc.fecha} · Nova jornada ${cfg.nova.tipo} ${cfg.nova.horas}h · Mês de referência ${mes.slice(5)}/${mes.slice(0, 4)}`]);
  cartoes(p, [['Equipe atual', String(a.equipe)], ['Necessário', String(a.necessario)], ['Contratações', String(a.contratacoes)], ['Custo mensal', brl(a.custo)], ['Horas descobertas/mês', fmtH(a.horasDescobertas * 60)]]);
  secao(p, '1. Conclusão'); a.conclusao.forEach(c => paragrafo(p, c));
  secao(p, '2. Contagem de turnos por setor');
  tabela(p, { head: [['Setor', 'Funcionamento', 'Turno no relógio', 'Turnos útil · sáb · dom', 'Postos', 'Pessoas-dia nec. x disp.', 'Equipe', 'Necessário', 'Contratar']], body: a.dims.map(d => { const r = resumoTurnos(cfg, d); const c = a.contagem.find(x => x.setor === d.setor)!; return [d.setor, r.funcionamento, r.relogio, r.porDia, d.postos, `${c.necessarias} x ${c.disponiveis}`, d.equipe, d.necessario, d.contratacoes]; }) });
  secao(p, '3. Equipe atual x necessário');
  const max = Math.max(1, ...a.dims.map(d => Math.max(d.equipe, d.necessario)));
  for (const d of a.dims) { quebra(p, 14); p.doc.setFontSize(8.5); p.doc.text(d.setor, 14, p.y + 3); const w = 120;
    p.doc.setFillColor(148, 163, 184); p.doc.roundedRect(60, p.y, (w * d.equipe) / max, 4, 1, 1, 'F'); p.doc.setFillColor(...AZUL2); p.doc.roundedRect(60, p.y + 5, (w * d.necessario) / max, 4, 1, 1, 'F');
    p.doc.setTextColor(...CINZA); p.doc.text(`${d.equipe} hoje`, 62 + (w * d.equipe) / max, p.y + 3.3); p.doc.text(`${d.necessario} necessário${d.contratacoes ? ` (+${d.contratacoes})` : ''}`, 62 + (w * d.necessario) / max, p.y + 8.3); p.doc.setTextColor(15, 23, 42); p.y += 13; }
  p.y += 2; secao(p, '4. Pontos falhos se a equipe atual for mantida');
  for (const f of a.sem) paragrafo(p, f.diasFalha ? `${f.setor}: falha em ${f.diasFalha} de ${f.diasAnalisados} dias, ${fmtH(f.pessoaHora * 60)} de pessoa-hora descoberta. Horários mais descobertos: ${f.top.map(t => `${t.faixa} (${t.dias} dias)`).join(', ') || '—'}.${f.diasSoAlmoco ? ` Em ${f.diasSoAlmoco} dias a falha ocorre só no almoço.` : ''}` : `${f.setor}: cobertura completa com a equipe atual.`);
  secao(p, '5. Contratar ou cobrir com hora extra');
  tabela(p, { head: [['Setor', 'Horas descobertas', 'Valor hora', 'Custo HE/mês', 'Custo contratar/mês', 'Situação']], body: a.he.map(h => [h.setor, fmtH(h.horas * 60), brl(h.valorHora), brl(h.custoHE), brl(h.custoContratar), h.inviavel ? 'Inviável' : 'Possível']) });
  paragrafo(p, 'Atenção: hora extra habitual gera passivo trabalhista — integra a remuneração e reflete em DSR, férias + 1/3, 13º salário e FGTS. Use como solução temporária.');
  secao(p, '6. Carga semanal x horário de funcionamento');
  for (const d of a.dims) { const v = viabilidadeTexto(cfg, d.setor); paragrafo(p, v.ok ? `${d.setor}: a carga de ${d.horas}h cabe no horário do setor.` : `${d.setor}: ${[...v.problemas.map(x => `${x.texto}${x.acoes.length ? ` Sugestões: ${x.acoes.map(z => z.rotulo).join('; ')}.` : ''}`), v.sugerirCompletar ? 'Recomenda-se completar a carga nos demais dias da semana.' : ''].filter(Boolean).join(' ')} ${v.alternativas.join(' ')}`); }
  secao(p, '7. Distribuição proposta por turno');
  tabela(p, { head: [['Setor', 'Turno', 'Horário (dia útil)', 'Pessoas']], body: a.dims.flatMap(d => d.turnos.map((t, i) => { const d0 = t.findIndex(Boolean); return [d.setor, `Turno ${i + 1}`, faixa(t[d0] ?? null), d.alocacao.filter(x => x.turno === i).map(x => (x.contratacao ? `${x.nome} (nova vaga)` : x.nome)).join(', ')]; })) });
  secao(p, '8. Premissas e base legal');
  paragrafo(p, 'CLT art. 58 (duração normal do trabalho), art. 59 (horas extras e compensação; §2º banco de horas/acordo), art. 67 (descanso semanal de 24h, preferencialmente aos domingos), art. 71 (intervalo de 1h acima de 6h e de 15 min acima de 4h), art. 386 (revezamento quinzenal do domingo para mulheres) e art. 611-A (prevalência do negociado, inclusive intervalo de 30 min). Lei 10.101/2000, art. 6º (comércio: folga em domingo ao menos 1 vez a cada 3 semanas).');
  paragrafo(p, 'Cálculos estimados a partir do cadastro. Valide as conclusões com o jurídico e com a convenção coletiva do sindicato antes de implementar.');
  finalizar(p, `Dimensionamento_${cliente.nome.replace(/\W+/g, '_')}_${mes}.pdf`);
}
export { analisar };
