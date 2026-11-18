import { useMemo, useState } from 'react';
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Legend, Line, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Users, UserPlus, Wallet, Target, FileDown, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fmtH } from '@/lib/escala';
import { useEscala } from './contexto';
import { analisar } from './analise';
import { relatorioDimensionamento } from './relatorioDimensionamento';
import { brl, Card, ChartTip, gradiente, Kpi, Vazio } from './ui';
export const proximoMes = () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 7); };
export function ComparativoPage() {
  const { cfg, colabs, ferias, dims, setores, patchSetor, client, loading } = useEscala(); const [mes, setMes] = useState(proximoMes()); const [setorCurva, setSetorCurva] = useState('');
  const a = useMemo(() => (setores.length ? analisar(cfg, colabs, ferias, dims, mes) : null), [cfg, colabs, ferias, dims, mes, setores.length]);
  if (!a) return <Vazio>{loading ? 'Carregando…' : 'Cadastre colaboradores com Setor para ver o comparativo.'}</Vazio>;
  const barras = a.dims.map(d => ({ setor: d.setor, Hoje: d.equipe, Necessário: d.necessario, rot: d.contratacoes ? `+${d.contratacoes}` : '' }));
  const fc = a.sem.find(f => f.setor === (setorCurva || a.sem[0]?.setor)); const curva = (fc?.curva ?? []).map(c => ({ ...c, falta: c.pior < c.postos ? [c.pior, c.postos] : null }));
  const totalAberto = a.sem.reduce((s, f) => s + f.curva.length * 0.25 * f.postos * (f.diasAnalisados || 0) / Math.max(1, f.curva.length ? 1 : 1), 0) || 1;
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
    <Card title="Pontos falhos mantendo o horário e a equipe atual" desc="Escala do mês gerada sem contratações, comparada a cada 15 min com os postos." action={<input type="month" aria-label="Mês" value={mes} onChange={e => e.target.value && setMes(e.target.value)} />}>
      <div className="ez-grid-falhas">
        <div className="ez-table-wrap"><table className="ez-table"><thead><tr><th>Setor</th><th>Dias com falha</th><th>Pessoa-hora descoberta</th><th>Horários mais descobertos</th><th>Só no almoço</th><th>Com contratações</th></tr></thead><tbody>
          {a.sem.map(f => { const c = a.com.find(x => x.setor === f.setor); return <tr key={f.setor}><td><b>{f.setor}</b></td><td className={`tabular ${f.diasFalha ? 'ez-bad-text' : ''}`}>{f.diasFalha}</td><td className="tabular">{fmtH(f.pessoaHora * 60)}</td><td>{f.top.map(t => `${t.faixa} (${t.dias} dias)`).join(' · ') || '—'}</td><td className="tabular">{f.diasSoAlmoco}</td><td className="tabular">{c ? `${c.diasFalha} dias · ${fmtH(c.pessoaHora * 60)}` : '—'}</td></tr>; })}
        </tbody></table></div>
        <div className="ez-gauge"><ResponsiveContainer width="100%" height={170}><RadialBarChart innerRadius="72%" outerRadius="100%" startAngle={210} endAngle={-30} data={[{ v: Math.min(100, (a.horasDescobertas / totalAberto) * 100) }]}><PolarAngleAxis type="number" domain={[0, 100]} tick={false} /><RadialBar dataKey="v" cornerRadius={10} fill={a.horasDescobertas ? '#DC2626' : '#16A34A'} background={{ fill: 'var(--muted)' }} animationDuration={900} /></RadialBarChart></ResponsiveContainer><strong className="tabular">{fmtH(a.horasDescobertas * 60)}</strong><span>horas descobertas no mês</span></div>
      </div>
      <div className="ez-card-head ez-mt"><h3>Cobertura ao longo do dia</h3><select aria-label="Setor da cobertura" value={fc?.setor ?? ''} onChange={e => setSetorCurva(e.target.value)}>{a.sem.map(f => <option key={f.setor}>{f.setor}</option>)}</select></div>
      <div style={{ height: 260 }}><ResponsiveContainer><ComposedChart data={curva} margin={{ left: -10, right: 10 }}>
        {gradiente('gCob', '#60A5FA', '#1D4ED8')}<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="hora" interval={7} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
        <Tooltip content={<ChartTip fmt={v => (Array.isArray(v) ? `${v[0]}–${v[1]}` : String(v))} />} /><Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="media" name="Presentes (média)" stroke="#1D4ED8" fill="url(#gCob)" fillOpacity={0.35} animationDuration={800} />
        <Area type="stepAfter" dataKey="falta" name="Abaixo do mínimo (pior dia)" stroke="none" fill="#DC2626" fillOpacity={0.28} />
        <Line type="stepAfter" dataKey="postos" name="Mínimo de postos" stroke="#0F172A" strokeDasharray="6 4" dot={false} />
      </ComposedChart></ResponsiveContainer></div>
    </Card>
    <div className="ez-grid2">
      <Card title="Contagem de turnos" desc="Pessoas-dia por turno na semana: necessárias x disponíveis com a equipe atual.">
        <table className="ez-table"><thead><tr><th>Setor</th><th>Necessárias</th><th>Disponíveis</th></tr></thead><tbody>{a.contagem.map(c => <tr key={c.setor}><td><b>{c.setor}</b></td><td className="tabular">{c.necessarias}</td><td className={`tabular ${c.falha.some(Boolean) ? 'ez-bad-cell' : ''}`}>{c.disponiveis}</td></tr>)}</tbody></table>
      </Card>
      <Card title="Contratar ou pagar hora extra" desc="Valor hora = salário médio ÷ (carga × 5); HE com 50% + encargos.">
        <table className="ez-table"><thead><tr><th>Setor</th><th>Horas/mês</th><th>Custo HE</th><th>Contratar</th><th /></tr></thead><tbody>{a.he.map(h => <tr key={h.setor}><td><b>{h.setor}</b></td><td className="tabular">{fmtH(h.horas * 60)}</td><td className="tabular">{brl(h.custoHE)}</td><td className="tabular">{brl(h.custoContratar)}</td><td>{h.inviavel ? <span className="ez-badge bad">Inviável</span> : h.horas ? <span className="ez-badge">Possível</span> : <span className="ez-badge ok">Sem falhas</span>}</td></tr>)}</tbody></table>
      </Card>
    </div>
    <Card title="Conclusão"><div className="ez-explain"><Lightbulb size={16} /><div>{a.conclusao.map(c => <p key={c}>{c}</p>)}</div></div></Card>
  </div>;
}
