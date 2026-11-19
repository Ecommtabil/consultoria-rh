import { useState } from 'react';
import { AlertTriangle, ArrowDownToLine, Briefcase, FileSpreadsheet, Layers, MoveHorizontal, TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { alertas, amplitude, brl, letras, pctBR, porFamilia, steps } from '@/lib/cargos/calc';
import { exportarMatriz, useCargos } from './dados';
export function Matriz({ clienteId, empresa }: { clienteId: string; empresa: string }) {
  const { cargos, n, pct } = useCargos(clienteId); const [busy, setBusy] = useState(false);
  const ls = letras(n); const grupos = porFamilia(cargos); const sal = cargos.map(c => c.salario_base ?? 0).filter(v => v > 0);
  const kpis = [[Briefcase, 'Total de cargos', String(cargos.length)], [Layers, 'Famílias', String(grupos.length)], [TrendingDown, 'Menor salário', sal.length ? brl(Math.min(...sal)) : '—'], [TrendingUp, 'Maior salário (último step)', sal.length ? brl(steps(Math.max(...sal), n, pct).at(-1)!) : '—'], [MoveHorizontal, 'Amplitude da faixa', pctBR(amplitude(n, pct))]] as const;
  const al = alertas(cargos);
  const dados = grupos.flatMap(g => g.cargos.map(c => { const s = steps(c.salario_base ?? 0, n, pct); return { nome: `${c.cargo ?? ''}`, familia: g.familia, faixa: [s[0]!, s.at(-1)!] as [number, number], gestao: c.trilha === 'Gestão', s }; }));
  function exportar() { setBusy(true); try { exportarMatriz(cargos, n, pct, empresa); toast.success('Matriz exportada.'); } catch (e) { toast.error(`Falha ao exportar: ${(e as Error).message}`); } finally { setBusy(false); } }
  return <div className="cg-stack">
    <div className="cg-kpis">{kpis.map(([I, l, v]) => <div key={l} className="cg-kpi"><span><I size={18} /></span><div><small>{l}</small><strong className="tabular-nums">{v}</strong></div></div>)}</div>
    {al.length > 0 && <ul className="cg-alerts">{al.map(a => <li key={a}><AlertTriangle size={14} />{a}</li>)}</ul>}
    <section className="cg-card"><div className="section-heading"><h2>Matriz salarial</h2><Button variant="outline" disabled={busy || !cargos.length} onClick={exportar}>{busy ? <ArrowDownToLine className="animate-pulse" /> : <FileSpreadsheet />}Exportar Excel</Button></div>
      <div className="employee-table-wrap"><table className="employee-table cg-matrix"><thead><tr><th>Família</th><th>Cargo</th><th>Nível</th>{ls.map(l => <th key={l} className="text-right">{l}</th>)}</tr></thead>
        <tbody>{grupos.flatMap(g => g.cargos.map((c, i) => <tr key={c.id ?? `${g.familia}${i}`} className={i === 0 ? 'cg-grp' : ''}><td>{i === 0 ? g.familia : ''}</td><td>{c.cargo}{c.trilha === 'Gestão' && <span className="cg-gestao"> (gestão)</span>}</td><td className="tabular-nums">{c.nivel}</td>{steps(c.salario_base ?? 0, n, pct).map((v, k) => <td key={k} className="text-right tabular-nums">{brl(v)}</td>)}</tr>))}</tbody></table>
        {!cargos.length && <p className="table-empty">Cadastre cargos em Estrutura de cargos.</p>}</div></section>
    {dados.length > 0 && <section className="cg-card"><h2>Faixas por cargo</h2><p className="cg-muted"><span className="cg-dot tec" />Técnica <span className="cg-dot ges" />Gestão</p>
      <div style={{ height: Math.max(220, dados.length * 34 + 60) }}><ResponsiveContainer width="100%" height="100%"><BarChart data={dados} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis type="number" domain={['dataMin - 200', 'dataMax + 200']} tickFormatter={v => `R$ ${Math.round(Number(v) / 100) / 10} mil`} stroke="var(--muted-foreground)" fontSize={11} />
        <YAxis type="category" dataKey="nome" width={210} fontSize={11} stroke="var(--muted-foreground)" tickFormatter={(v, i) => { const d = dados[i]; return d && (i === 0 || dados[i - 1]?.familia !== d.familia) ? `${d.familia} · ${v}` : String(v); }} />
        <Tooltip cursor={{ fill: 'var(--accent)' }} content={({ payload }) => { const d = payload?.[0]?.payload as (typeof dados)[number] | undefined; return d ? <div className="cg-tip"><strong>{d.nome}</strong><span>{d.familia} · {d.gestao ? 'Gestão' : 'Técnica'}</span>{d.s.map((v, k) => <span key={k} className="tabular-nums">{ls[k]}: {brl(v)}</span>)}</div> : null; }} />
        <Bar dataKey="faixa" radius={4} barSize={16}>{dados.map((d, i) => <Cell key={i} fill={d.gestao ? 'var(--brand-dark)' : 'var(--brand-mid)'} />)}</Bar>
      </BarChart></ResponsiveContainer></div></section>}
  </div>;
}
