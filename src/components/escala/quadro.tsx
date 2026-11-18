import { Fragment, useMemo, useState } from 'react';
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';
import { FileDown, FileSpreadsheet, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { calcAlmocos, ddmes, diaSemana, DIAS_LONGO, duracaoAlmoco, ehTrabalho, fmt, fmtH, semanas, toMin, totaisSemana, type Almoco, type EscalaDados } from '@/lib/escala';
import { useEscala } from './contexto';
import { alternarCelula, useSalvarEscala } from './mensal';
import { alertasSemana, SemanaSelect, SemEscala } from './almocos';
import { exportarQuadro } from './exportar';
import { relatorioQuadro, type OpcoesQuadro } from './relatorioQuadro';
import { Card } from './ui';
export function problemaAlmoco(j: [number, number], a: Almoco): string | null {
  if (!a) return null; const dur = a.fim - a.ini; const min = duracaoAlmoco(j[1] - j[0]);
  if (a.ini < j[0] || a.fim > j[1]) return 'Almoço fora do turno'; if (dur < min) return `Menor que o mínimo da CLT (${min} min)`; if (dur > 120) return 'Almoço acima de 2h'; if (a.ini - j[0] < 60) return 'Começa menos de 1h após a entrada'; return null;
}
const setAlm = (e: EscalaDados, pid: string, i: number, v: string | null): EscalaDados => { const l = [...(e.grade[pid] ?? [])]; l[i] = { ...l[i]!, alm: v }; return { ...e, grade: { ...e.grade, [pid]: l } }; };
export function QuadroPage() {
  const { aberta, mudarAberta, client, cfg } = useEscala(); const [w, setW] = useState(0); const [pdf, setPdf] = useState(false); const salvar = useSalvarEscala();
  const e = aberta?.dados; const alm = useMemo(() => (e ? calcAlmocos(e) : {}), [e]);
  if (!e) return <SemEscala />;
  const sem = semanas(e)[w] ?? []; const tot = totaisSemana(e, w, alm);
  function mudar(pid: string, i: number, campo: 'ini' | 'fim', v: string) {
    const a = alm[pid]?.[i]; const m = toMin(v); if (Number.isNaN(m)) return; const ini = campo === 'ini' ? m : a?.ini ?? m; const fim = campo === 'ini' ? m + (a ? a.fim - a.ini : 60) : m;
    mudarAberta(d => setAlm(d, pid, i, `${fmt(ini)}-${fmt(fim)}`));
  }
  return <div className="ez-stack">
    <div className="ez-row ez-wrap"><SemanaSelect e={e} w={w} setW={setW} /><Button onClick={salvar}><Save />Salvar alterações{aberta?.sujo ? ' *' : ''}</Button><Button variant="outline" onClick={() => exportarQuadro(e, alm, client.nome.replace(/\W+/g, '_'))}><FileSpreadsheet />Exportar Excel</Button><Button variant="outline" onClick={() => setPdf(true)}><FileDown />Relatório PDF</Button></div>
    <Card title={`Quadro semanal · ${aberta!.id}`} desc="Horários de almoço editáveis. Dias de outro mês em cinza (somente leitura).">
      <div className="ez-table-wrap"><table className="ez-quadro"><thead><tr><th>DIA</th><th>Nº</th><th>NOME</th><th>SETOR</th><th>ENTRADA</th><th>SAÍDA</th><th>ENTRADA</th><th>SAÍDA</th><th /></tr></thead><tbody>
        {sem.map((d, k) => { const i = w * 7 + k; const fora = !d.startsWith(e.mes); const dom = diaSemana(d) === 6; const trab = e.pessoas.filter(p => ehTrabalho(e.grade[p.id]?.[i]?.c ?? 'X')); const resto = e.pessoas.filter(p => !trab.includes(p));
          const fechado = Object.values(e.setores).every(s => !s.horarios[diaSemana(d)]); let minT = 0;
          const linhas = trab.map((p, n) => { const c = e.grade[p.id]![i]!; const j = e.codigos[c.c]!; const a = alm[p.id]?.[i] ?? null; const prob = problemaAlmoco(j, a); minT += j[1] - j[0] - (a ? a.fim - a.ini : 0);
            return <tr key={p.id} className={fora ? 'fora' : ''}><td className="tabular">{n + 1}</td><td>{p.nome}</td><td>{p.setor}</td><td className="tabular">{fmt(j[0])}</td>
              <td className={prob ? 'ez-bad-cell' : ''} title={prob ?? undefined}><input type="time" disabled={fora} aria-label={`Saída para almoço de ${p.nome}`} value={a ? fmt(a.ini) : ''} onChange={x => mudar(p.id, i, 'ini', x.target.value)} /></td>
              <td className={prob ? 'ez-bad-cell' : ''} title={prob ?? undefined}><input type="time" disabled={fora} aria-label={`Volta do almoço de ${p.nome}`} value={a ? fmt(a.fim) : ''} onChange={x => mudar(p.id, i, 'fim', x.target.value)} /></td>
              <td className="tabular">{fmt(j[1])}</td><td className="ez-row-actions">{!fora && <>{c.alm && <Button size="icon" variant="ghost" title="Voltar ao almoço automático" aria-label="Voltar ao almoço automático" onClick={() => mudarAberta(x => setAlm(x, p.id, i, null))}><RotateCcw /></Button>}<Button size="sm" variant="ghost" onClick={() => mudarAberta(x => alternarCelula(x, p.id, i))}>Dar folga</Button></>}</td></tr>; });
          return <Fragment key={d}>{[<tr key="h" className={`ez-q-day ${dom ? 'dom' : ''} ${fora ? 'fora' : ''}`}><td rowSpan={linhas.length + 3}><b>{ddmes(d)}</b><span>{DIAS_LONGO[diaSemana(d)]}</span></td>{fechado ? <td colSpan={8} className="ez-q-closed">FECHADO</td> : linhas.length ? null : <td colSpan={8} className="ez-muted">Ninguém trabalhando.</td>}</tr>,
            ...linhas,
            <tr key="r" className={fora ? 'fora' : ''}><td colSpan={8} className="ez-q-rest">{resto.map(p => { const c = e.grade[p.id]?.[i]?.c ?? 'X'; return <span key={p.id} className="ez-q-tag">{p.nome}: {c === 'FE' ? 'FÉRIAS' : c === 'X' ? 'FECHADO' : dom ? 'FOLGA (domingo)' : 'FOLGA'}{!fora && c === 'F' && <button type="button" onClick={() => mudarAberta(x => alternarCelula(x, p.id, i))}>Trabalhar</button>}</span>; })}</td></tr>,
            <tr key="t" className="ez-total"><td colSpan={8}>Total do dia: {trab.length} trabalhando · {resto.filter(p => e.grade[p.id]?.[i]?.c === 'F').length} de folga · {resto.filter(p => e.grade[p.id]?.[i]?.c === 'FE').length} férias · {fmtH(minT)} trabalhadas</td></tr>]}</Fragment>; })}
      </tbody></table></div>
    </Card>
    <Card title="Totais da semana">
      <div className="ez-radials">{tot.map(t => { const pct = Math.round((t.horas / (t.carga || 1)) * 100); return <div key={t.id} className="ez-radial"><RadialBarChart width={84} height={84} innerRadius="74%" outerRadius="100%" startAngle={90} endAngle={-270} data={[{ v: Math.min(100, pct) }]}><PolarAngleAxis type="number" domain={[0, 100]} tick={false} /><RadialBar dataKey="v" cornerRadius={8} fill={pct > 100 ? '#DC2626' : pct === 100 ? '#16A34A' : '#1D4ED8'} background={{ fill: 'var(--muted)' }} /></RadialBarChart><strong className="tabular">{pct}%</strong><span>{t.nome}</span></div>; })}</div>
      <div className="ez-table-wrap"><table className="ez-table"><thead><tr><th>Funcionário</th><th>Dias</th><th>Folgas (total)</th><th>Escaladas</th><th>Empresa fechada</th><th>Em domingo</th><th>Férias</th><th>Horas</th><th>Carga</th><th>Saldo</th><th>Situação</th></tr></thead><tbody>
        {tot.map(t => <tr key={t.id}><td>{t.nome}</td><td>{t.dias}</td><td>{t.folgas}</td><td>{t.escaladas}</td><td>{t.fechada}</td><td>{t.domingo}</td><td>{t.ferias}</td><td className="tabular">{fmtH(t.horas)}</td><td className="tabular">{fmtH(t.carga)}</td><td className={`tabular ${t.saldo && t.saldo > 0 ? 'ez-bad-text' : ''}`}>{t.saldo == null ? '—' : `${t.saldo > 0 ? '+' : ''}${fmtH(t.saldo)}`}</td><td>{t.situacao}</td></tr>)}
        <tr className="ez-total"><td>Total</td><td>{tot.reduce((s, t) => s + t.dias, 0)}</td><td>{tot.reduce((s, t) => s + t.folgas, 0)}</td><td>{tot.reduce((s, t) => s + t.escaladas, 0)}</td><td>{tot.reduce((s, t) => s + t.fechada, 0)}</td><td>{tot.reduce((s, t) => s + t.domingo, 0)}</td><td>{tot.reduce((s, t) => s + t.ferias, 0)}</td><td>{fmtH(tot.reduce((s, t) => s + t.horas, 0))}</td><td>{fmtH(tot.reduce((s, t) => s + t.carga, 0))}</td><td /><td /></tr></tbody></table></div>
    </Card>
    <PdfDialog open={pdf} onClose={() => setPdf(false)} onGerar={o => { relatorioQuadro(client, cfg, e, alm, w, o, alertasSemana); setPdf(false); }} />
  </div>;
}
function PdfDialog({ open, onClose, onGerar }: { open: boolean; onClose: () => void; onGerar: (o: OpcoesQuadro) => void }) {
  const [o, setO] = useState<OpcoesQuadro>({ escopo: 'semana', resumo: true, totais: true, alertas: true, assinaturas: true });
  return <Dialog open={open} onOpenChange={v => !v && onClose()}><DialogContent><DialogTitle>Relatório PDF do quadro</DialogTitle><DialogDescription>A4 retrato, uma semana por página.</DialogDescription>
    <div className="ez-seg"><button type="button" className={o.escopo === 'semana' ? 'on' : ''} onClick={() => setO({ ...o, escopo: 'semana' })}>Semana selecionada</button><button type="button" className={o.escopo === 'mes' ? 'on' : ''} onClick={() => setO({ ...o, escopo: 'mes' })}>Mês inteiro</button></div>
    <div className="ez-checks">{([['resumo', 'Resumo'], ['totais', 'Totais por funcionário'], ['alertas', 'Alertas'], ['assinaturas', 'Campos de assinatura']] as const).map(([k, l]) => <label key={k}><input type="checkbox" checked={o[k]} onChange={x => setO({ ...o, [k]: x.target.checked })} />{l}</label>)}</div>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={() => onGerar(o)}><FileDown />Gerar PDF</Button></div></DialogContent></Dialog>;
}
