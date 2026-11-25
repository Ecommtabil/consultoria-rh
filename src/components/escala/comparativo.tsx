import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, UserPlus, Wallet, Target, FileDown, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fmtH } from '@/lib/escala';
import { useEscala } from './contexto';
import { analisar } from './analise';
import { relatorioDimensionamento } from './relatorioDimensionamento';
import { brl, Card, ChartTip, gradiente, Kpi, Vazio } from './ui';
export const proximoMes = () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 7); };
export function ComparativoPage() {
  const { cfg, colabs, ferias, dims, setores, patchSetor, client, loading } = useEscala(); const [mes, setMes] = useState(proximoMes());
  const a = useMemo(() => (setores.length ? analisar(cfg, colabs, ferias, dims, mes) : null), [cfg, colabs, ferias, dims, mes, setores.length]);
  if (!a) return <Vazio>{loading ? 'Carregando…' : 'Cadastre colaboradores com Setor para ver o comparativo.'}</Vazio>;
  const barras = a.dims.map(d => ({ setor: d.setor, Hoje: d.equipe, Necessário: d.necessario, rot: d.contratacoes ? `+${d.contratacoes}` : '' }));
  return <div className="ez-stack">
    <div className="ez-kpis"><Kpi icon={Users} label="Equipe atual" value={a.equipe} /><Kpi icon={Target} label="Necessários na nova jornada" value={a.necessario} note={`${cfg.nova.tipo} · ${cfg.nova.horas}h`} /><Kpi icon={UserPlus} label="Contratações" value={a.contratacoes} tone={a.contratacoes ? 'warn' : 'ok'} /><Kpi icon={Wallet} label="Custo mensal" value={brl(a.custo)} note={`Encargos ${cfg.nova.encargos}%`} /></div>
    <Card title="Dimensionamento por setor" desc="Postos simultâneos podem ser ajustados; o padrão vem da equipe e da jornada atual predominante." action={<Button onClick={() => relatorioDimensionamento(client, cfg, a, mes)}><FileDown />Relatório de dimensionamento (PDF)</Button>}>
      <div className="ez-table-wrap"><table className="ez-table"><thead><tr><th>Setor</th><th>Postos simultâneos</th><th>Turnos</th><th>Equipe atual</th><th>Necessários</th><th>Contratações</th><th>Custo mensal</th></tr></thead><tbody>
        {a.dims.map(d => <tr key={d.setor}><td><b>{d.setor}</b></td><td><input type="number" min={1} className="ez-num" aria-label={`Postos de ${d.setor}`} value={cfg.setores[d.setor]?.postos ?? ''} placeholder={String(d.postosPadrao)} onChange={e => patchSetor(d.setor, { postos: e.target.value ? Number(e.target.value) : null })} /></td><td className="tabular">{d.turnos.length}</td><td className="tabular">{d.equipe}</td><td className="tabular">{d.necessario}</td><td className={`tabular ${d.contratacoes ? 'ez-warn-num' : ''}`}>{d.contratacoes ? `+${d.contratacoes}` : '0'}</td><td className="tabular">{brl(d.custo)}</td></tr>)}
        <tr className="ez-total"><td>Total</td><td /><td /><td>{a.equipe}</td><td>{a.necessario}</td><td>{a.contratacoes ? `+${a.contratacoes}` : 0}</td><td>{brl(a.custo)}</td></tr></tbody></table></div>
    </Card>
    <Card title="Equipe atual x necessário por setor">
      <div style={{ height: Math.max(180, barras.length * 64) }}><ResponsiveContainer><BarChart data={barras} layout="vertical" margin={{ left: 10, right: 40 }} barGap={4}>
        {gradiente('gNec', '#3B82F6', '#1D4ED8')}<CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} /><YAxis type="category" dataKey="setor" width={110} tick={{ fontSize: 12, fill: 'var(--foreground)' }} />
        <Tooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTip />} /><Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Hoje" fill="#94A3B8" radius={[0, 6, 6, 0]} animationDuration={700} /><Bar dataKey="Necessário" fill="url(#gNec)" radius={[0, 6, 6, 0]} animationDuration={800}><LabelList dataKey="rot" position="right" fill="#D97706" fontSize={12} fontWeight={600} /></Bar>
      </BarChart></ResponsiveContainer></div>
    </Card>
    <Card title="Demonstrativo simples: falhas e contratação" desc="Escala do mês montada sem pessoas sobrando no posto. Falha = algum horário de funcionamento sem ninguém no posto (inclui almoço)." action={<input type="month" aria-label="Mês" value={mes} onChange={e => e.target.value && setMes(e.target.value)} />}>
      <div className="ez-table-wrap"><table className="ez-table"><thead><tr><th>Setor</th><th>Postos</th><th>Equipe hoje</th><th>Necessários</th><th>Contratar</th><th>Falhas no mês com a equipe atual</th><th>Depois de contratar</th><th>Situação</th></tr></thead><tbody>
        {a.dims.map(d => { const f = a.sem.find(x => x.setor === d.setor); const c = a.com.find(x => x.setor === d.setor); const falha = (x?: typeof f) => (x && x.diasFalha ? `${x.diasFalha} dias · ${fmtH(x.pessoaHora * 60)} sem cobertura` : 'Sem falhas');
          const sit = !f?.diasFalha ? 'Coberto' : d.contratacoes ? `Contratar ${d.contratacoes}` : 'Ajustar horários';
          return <tr key={d.setor}><td><b>{d.setor}</b></td><td className="tabular">{d.postos}</td><td className="tabular">{d.equipe}</td><td className="tabular">{d.necessario}</td><td className={`tabular ${d.contratacoes ? 'ez-warn-num' : ''}`}>{d.contratacoes ? `+${d.contratacoes}` : '0'}</td>
            <td className={f?.diasFalha ? 'ez-bad-text' : ''}>{falha(f)}{f?.top[0] ? <div className="text-xs text-muted-foreground">Mais comum: {f.top[0].faixa}</div> : null}</td><td>{falha(c)}</td>
            <td>{sit === 'Coberto' ? <span className="ez-badge ok">Coberto</span> : <span className="ez-badge bad">{sit}</span>}</td></tr>; })}
      </tbody></table></div>
    </Card>
    <div className="ez-grid2">
      <Card title="Contratar ou pagar hora extra" desc="Valor hora = salário médio ÷ (carga × 5); HE com 50% + encargos.">
        <table className="ez-table"><thead><tr><th>Setor</th><th>Horas/mês</th><th>Custo HE</th><th>Contratar</th><th /></tr></thead><tbody>{a.he.map(h => <tr key={h.setor}><td><b>{h.setor}</b></td><td className="tabular">{fmtH(h.horas * 60)}</td><td className="tabular">{brl(h.custoHE)}</td><td className="tabular">{brl(h.custoContratar)}</td><td>{h.inviavel ? <span className="ez-badge bad">Inviável</span> : h.horas ? <span className="ez-badge">Possível</span> : <span className="ez-badge ok">Sem falhas</span>}</td></tr>)}</tbody></table>
      </Card>
    </div>
    <Card title="Conclusão"><div className="ez-explain"><Lightbulb size={16} /><div>{a.conclusao.map(c => <p key={c}>{c}</p>)}</div></div></Card>
  </div>;
}
