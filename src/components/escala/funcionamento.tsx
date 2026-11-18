import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CORES_TURNO, explicaJornada, fmt, fmtH, horarioBase, janela, setorCfg, viabilidadeCarga, regimeSetor, type Regime, type SetorConfig } from '@/lib/escala';
import { useEscala } from './contexto';
import { Card, DiaChips, Field, Vazio } from './ui';
const NOVAS = ['6x1-40', '6x1-42', '6x1-44', '5x2-40', '5x2-42', '5x2-44'];
export function FuncionamentoPage() {
  const { cfg, patchCfg, setores, dims, loading } = useEscala();
  const jan = janela(cfg.empresa.abre, cfg.empresa.fecha); const aberto = jan ? jan.fim - jan.ini : 0;
  const ex = explicaJornada(cfg.nova.tipo, cfg.nova.horas, aberto);
  const setE = (p: Partial<typeof cfg.empresa>) => patchCfg(c => ({ ...c, empresa: { ...c.empresa, ...p } }));
  const setN = (p: Partial<typeof cfg.nova>) => patchCfg(c => ({ ...c, nova: { ...c.nova, ...p } }));
  const gantt = setores.map(s => { const sc = setorCfg(cfg, s); const b = horarioBase(sc); const row: Record<string, unknown> = { setor: s, aberto: b ? [b.ini, b.fim] : null };
    const d0 = [0, 1, 2, 3, 4, 5, 6].find(d => dims[s]?.turnos[0]?.[d]) ?? 0; dims[s]?.turnos.forEach((t, i) => { const w = t[d0]; if (w) row[`t${i}`] = [w.ini, w.fim]; }); return row; });
  const maxT = Math.max(1, ...setores.map(s => dims[s]?.turnos.length ?? 0)); const maxFim = Math.max(1440, ...gantt.map(g => (g.aberto as number[] | null)?.[1] ?? 0));
  return <div className="ez-stack">
    <div className="ez-grid2">
      <Card title="Funcionamento da empresa" desc="Horário de abertura e dias de operação. O fechamento pode passar da meia-noite.">
        <div className="ez-row"><Field label="Abre às"><input type="time" value={cfg.empresa.abre} onChange={e => setE({ abre: e.target.value })} /></Field><Field label="Fecha às"><input type="time" value={cfg.empresa.fecha} onChange={e => setE({ fecha: e.target.value })} /></Field></div>
        <Field label="Dias de funcionamento"><DiaChips value={cfg.empresa.dias} onChange={dias => setE({ dias })} /></Field>
      </Card>
      <Card title="Nova jornada a comparar" desc="Regra que será usada no Comparativo e na escala do cenário novo.">
        <div className="ez-row">
          <Field label="Tipo"><div className="ez-seg">{(['6x1', '5x2'] as Regime[]).map(t => <button type="button" key={t} className={cfg.nova.tipo === t ? 'on' : ''} onClick={() => setN({ tipo: t })}>{t}</button>)}</div></Field>
          <Field label="Horas semanais"><div className="ez-seg">{[40, 42, 44].map(h => <button type="button" key={h} className={cfg.nova.horas === h ? 'on' : ''} onClick={() => setN({ horas: h })}>{h}h</button>)}</div></Field>
        </div>
        <div className="ez-row">
          <Field label="Folga em domingo" hint="Padrão do comércio: 1 a cada 3 semanas (Lei 10.101/2000, art. 6º)."><select value={cfg.nova.domingo} onChange={e => setN({ domingo: Number(e.target.value) as 0 | 3 | 4 | 7 })}><option value={3}>1 a cada 3 semanas</option><option value={4}>1 a cada 4 semanas</option><option value={7}>1 a cada 7 semanas</option><option value={0}>Sem regra</option></select></Field>
          <Field label="Encargos sobre a folha (%)"><input type="number" min={0} max={200} value={cfg.nova.encargos} onChange={e => setN({ encargos: Number(e.target.value) || 0 })} /></Field>
        </div>
        <div className="ez-explain"><Clock size={16} /><p>Na {cfg.nova.tipo} de {cfg.nova.horas}h, a jornada diária é de <b>{fmtH(ex.jornada)}</b> ({cfg.nova.horas}h × 60 ÷ {ex.dias} dias). Com intervalo de <b>{ex.intervalo} min</b> (CLT art. 71), cada turno ocupa <b>{fmtH(ex.relogio)}</b> no relógio. Para {fmtH(aberto)} de funcionamento, são necessários <b>{ex.turnos} turno{ex.turnos === 1 ? '' : 's'} por dia</b>.</p></div>
        {ex.avisos.map(a => <p key={a} className="ez-alert warn"><AlertTriangle size={15} />{a}</p>)}
      </Card>
    </div>
    <Card title="Linha do tempo 24h de turnos" desc="Faixa azul-gelo = funcionamento do setor; barras = turnos da nova jornada (dia útil).">
      {gantt.length ? <div style={{ height: Math.max(160, gantt.length * (40 + maxT * 16)) }}><ResponsiveContainer><BarChart data={gantt} layout="vertical" barGap={2} margin={{ left: 10, right: 20 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis type="number" domain={[0, maxFim]} ticks={Array.from({ length: Math.floor(maxFim / 120) + 1 }, (_, i) => i * 120)} tickFormatter={v => fmt(Number(v))} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
        <YAxis type="category" dataKey="setor" width={110} tick={{ fontSize: 12, fill: 'var(--foreground)' }} />
        <Tooltip cursor={{ fill: 'var(--muted)' }} content={({ active, payload, label }) => active && payload?.length ? <div className="ez-tip"><strong>{String(label)}</strong>{payload.map((p, i) => { const v = p.value as number[]; return <div key={i}><span style={{ background: p.color }} />{p.name}: <b>{fmt(v[0]!)}–{fmt(v[1]!)}</b></div>; })}</div> : null} />
        <Bar dataKey="aberto" name="Funcionamento" fill="#DBEAFE" radius={6} animationDuration={600} />
        {Array.from({ length: maxT }, (_, i) => <Bar key={i} dataKey={`t${i}`} name={`Turno ${i + 1}`} fill={CORES_TURNO[i % CORES_TURNO.length]} radius={6} animationDuration={700} />)}
      </BarChart></ResponsiveContainer></div> : <Vazio>{loading ? 'Carregando…' : 'Cadastre colaboradores com o campo Setor para ver os turnos.'}</Vazio>}
    </Card>
    <h2 className="ez-h2">Funcionamento por setor</h2>
    {setores.length === 0 && !loading && <Vazio>Nenhum setor encontrado. Os setores vêm do campo Setor dos colaboradores.</Vazio>}
    <div className="ez-grid2">{setores.map(s => <SetorCard key={s} setor={s} />)}</div>
  </div>;
}
function SetorCard({ setor }: { setor: string }) {
  const { cfg, patchSetor, patchCfg } = useEscala(); const raw = cfg.setores[setor] ?? {}; const sc = setorCfg(cfg, setor); const r = regimeSetor(cfg, setor);
  const v = viabilidadeCarga(sc, r.regime, r.horas); const set = (p: Partial<SetorConfig>) => patchSetor(setor, p);
  const reset = () => patchCfg(c => { const { [setor]: _, ...rest } = c.setores; return { ...c, setores: { ...rest, [setor]: { postos: raw.postos } } }; });
  return <Card title={setor} action={<Button variant="outline" size="sm" onClick={reset}><RotateCcw />Usar o da empresa</Button>}>
    <Field label="Dias de funcionamento"><DiaChips value={sc.dias} onChange={dias => set({ dias })} /></Field>
    <div className="ez-row"><Field label="Abre"><input type="time" value={sc.abre} onChange={e => set({ abre: e.target.value })} /></Field><Field label="Fecha"><input type="time" value={sc.fecha} onChange={e => set({ fecha: e.target.value })} /></Field></div>
    <div className="ez-row">
      <Field label="Sábado (em branco = mesmo horário)"><div className="ez-pair"><input type="time" aria-label="Sábado abre" value={raw.sabAbre ?? ''} onChange={e => set({ sabAbre: e.target.value })} /><input type="time" aria-label="Sábado fecha" value={raw.sabFecha ?? ''} onChange={e => set({ sabFecha: e.target.value })} /></div></Field>
      <Field label="Domingo (em branco = mesmo horário)"><div className="ez-pair"><input type="time" aria-label="Domingo abre" value={raw.domAbre ?? ''} onChange={e => set({ domAbre: e.target.value })} /><input type="time" aria-label="Domingo fecha" value={raw.domFecha ?? ''} onChange={e => set({ domFecha: e.target.value })} /></div></Field>
    </div>
    <div className="ez-checks"><label><input type="checkbox" checked={!!raw.semContratar} onChange={e => set({ semContratar: e.target.checked })} />Gerar com a equipe atual (sem contratações)</label><label><input type="checkbox" checked={!!raw.completarCarga} onChange={e => set({ completarCarga: e.target.checked })} />Completar a carga na semana</label></div>
    <div className="ez-row">
      <Field label="Rodízio de sábado"><select value={raw.rodizioSab ?? 0} onChange={e => set({ rodizioSab: Number(e.target.value) as 0 | 2 | 3 | 4 })}><option value={0}>Sem rodízio</option><option value={2}>1 a cada 2 semanas</option><option value={3}>1 a cada 3 semanas</option><option value={4}>1 a cada 4 semanas</option></select></Field>
      <Field label="Nova jornada do setor"><select value={raw.nova ?? 'empresa'} onChange={e => set({ nova: e.target.value })}><option value="empresa">Padrão da empresa ({cfg.nova.tipo} {cfg.nova.horas}h)</option>{NOVAS.map(n => <option key={n} value={n}>{n.replace('-', ' ')}h</option>)}</select></Field>
    </div>
    <div className="ez-viab">
      {v.problemas.map((p, i) => <div key={i} className="ez-alert bad"><AlertTriangle size={15} /><div><p>{p.texto}</p>{p.acoes.length > 0 && <div className="ez-actions">{p.acoes.map(a => <Button key={a.rotulo} size="sm" variant="outline" onClick={() => set(a.patch)}>{a.rotulo}</Button>)}</div>}</div></div>)}
      {v.sugerirCompletar && <div className="ez-alert warn"><AlertTriangle size={15} /><div><p>Na semana com dia curto, os turnos-base não fecham {r.horas}h. Marcar “Completar a carga” alonga os demais dias.</p><div className="ez-actions"><Button size="sm" variant="outline" onClick={() => set({ completarCarga: true })}>Marcar “Completar a carga”</Button></div></div></div>}
      {v.alternativas.length > 0 && <ul className="ez-alts">{v.alternativas.map(a => <li key={a}>{a}</li>)}</ul>}
      {v.ok && <p className="ez-alert ok"><CheckCircle2 size={15} />Carga de {r.horas}h na {r.regime} cabe no horário do setor.</p>}
    </div>
  </Card>;
}
