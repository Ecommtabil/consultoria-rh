import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCog, FolderOpen, Save, Trash2, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { CORES_TURNO, DIAS_LONGO, diaSemana, ehTrabalho, fmt, gerarEscala, normalizarEscala, semanas, totaisSemana, trabalhoJanela, fmtH, type EscalaDados } from '@/lib/escala';
import { useEscala } from './contexto';
import { proximoMes } from './comparativo';
import { exportarEscala, legenda } from './exportar';
import { Card, Vazio } from './ui';
export const escalasOptions = (id: string) => ({ queryKey: ['escalas', id], queryFn: async () => { const { data, error } = await supabase.from('escalas').select('id,atualizado_em').eq('cliente_id', id).order('id', { ascending: false }); if (error) throw error; return data ?? []; } });
export function useSalvarEscala() {
  const { client, aberta, setAberta } = useEscala(); const qc = useQueryClient();
  return async () => { if (!aberta) return; const { error } = await supabase.from('escalas').upsert({ cliente_id: client.id, id: aberta.id, dados: aberta.dados as unknown as Json, atualizado_em: new Date().toISOString() }); if (error) return void toast.error(error.message); setAberta({ ...aberta, sujo: false }); await qc.invalidateQueries({ queryKey: ['escalas', client.id] }); toast.success('Escala salva.'); };
}
export function corCodigo(e: EscalaDados, c: string) { const k = Object.keys(e.codigos).indexOf(c); return CORES_TURNO[k % CORES_TURNO.length]!; }
export function alternarCelula(e: EscalaDados, pid: string, i: number): EscalaDados {
  const linha = [...(e.grade[pid] ?? [])]; const cel = linha[i]; if (!cel || cel.c === 'X' || cel.c === 'FE') return e;
  if (ehTrabalho(cel.c)) linha[i] = { c: 'F', e: 1, w: cel.c };
  else { const dow = diaSemana(e.dias[i]!); const alt = cel.w ?? linha.find((x, k) => ehTrabalho(x.c) && diaSemana(e.dias[k]!) === dow)?.c ?? linha.find(x => ehTrabalho(x.c))?.c; if (!alt) return e; linha[i] = { c: alt, e: 1 }; }
  return { ...e, grade: { ...e.grade, [pid]: linha } };
}
export function MensalPage() {
  const { client, cfg, colabs, ferias, dims, aberta, setAberta, mudarAberta } = useEscala(); const qc = useQueryClient();
  const [mes, setMes] = useState(aberta?.dados.mes ?? proximoMes()); const [cen, setCen] = useState<'atual' | 'nova'>(aberta?.dados.cenario ?? 'nova'); const [filtro, setFiltro] = useState('todos');
  const lista = useQuery(escalasOptions(client.id)); const salvar = useSalvarEscala();
  function gerar() { if (!colabs.length) return void toast.error('Cadastre a equipe primeiro.'); if (aberta?.sujo && !confirm('Há alterações não salvas. Gerar uma nova escala mesmo assim?')) return; setAberta({ id: `${mes}-${cen}`, dados: gerarEscala({ cfg, colabs, ferias, mes, cenario: cen, dims }), sujo: true }); }
  async function abrir(id: string) { const { data, error } = await supabase.from('escalas').select('dados').eq('cliente_id', client.id).eq('id', id).single(); if (error) return void toast.error(error.message); const d = normalizarEscala(data.dados); if (!d) return void toast.error('Escala em formato desconhecido.'); setAberta({ id, dados: d, sujo: false }); setMes(d.mes); setCen(d.cenario); }
  async function excluir(id: string) { if (!confirm(`Excluir a escala ${id}?`)) return; const { error } = await supabase.from('escalas').delete().eq('cliente_id', client.id).eq('id', id); if (error) return void toast.error(error.message); if (aberta?.id === id) setAberta(null); await qc.invalidateQueries({ queryKey: ['escalas', client.id] }); }
  const e = aberta?.dados; const ids = useMemo(() => !e ? [] : e.pessoas.filter(p => filtro === 'todos' || p.setor === filtro.slice(2) && filtro.startsWith('s:') || p.id === filtro.slice(2) && filtro.startsWith('p:')).map(p => p.id), [e, filtro]);
  return <div className="ez-stack">
    <Card title="Escala mensal" desc="Simula as semanas completas (seg–dom) que contêm o mês.">
      <div className="ez-row ez-wrap"><input type="month" aria-label="Mês" value={mes} onChange={x => x.target.value && setMes(x.target.value)} /><select aria-label="Cenário" value={cen} onChange={x => setCen(x.target.value as 'atual' | 'nova')}><option value="atual">Jornada atual</option><option value="nova">Nova jornada</option></select>
        <Button onClick={gerar}><CalendarCog />Gerar escala</Button><Button variant="outline" disabled={!aberta} onClick={salvar}><Save />Salvar{aberta?.sujo ? ' *' : ''}</Button><Button variant="outline" disabled={!e} onClick={() => e && exportarEscala(e, ids, client.nome.replace(/\W+/g, '_'))}><FileSpreadsheet />Exportar Excel</Button></div>
      {lista.data?.length ? <ul className="ez-list">{lista.data.map(x => <li key={x.id} className={aberta?.id === x.id ? 'on' : ''}><span><b>{x.id}</b> · salva em {new Date(x.atualizado_em).toLocaleString('pt-BR')}</span><span><Button variant="ghost" size="sm" onClick={() => abrir(x.id)}><FolderOpen />Abrir</Button><Button variant="ghost" size="sm" onClick={() => excluir(x.id)}><Trash2 />Excluir</Button></span></li>)}</ul> : <p className="ez-muted">Nenhuma escala salva para este cliente.</p>}
    </Card>
    {e ? <Card title={`${aberta!.id} · ${e.cenario === 'nova' ? 'Nova jornada' : 'Jornada atual'}`} desc="Clique em uma célula para alternar trabalho/folga." action={<select aria-label="Mostrar" value={filtro} onChange={x => setFiltro(x.target.value)}><option value="todos">Mostrar: todos</option><optgroup label="Setor">{Object.keys(e.setores).map(s => <option key={s} value={`s:${s}`}>{s}</option>)}</optgroup><optgroup label="Funcionário">{e.pessoas.map(p => <option key={p.id} value={`p:${p.id}`}>{p.nome}</option>)}</optgroup></select>}>
      {e.avisos.length > 0 && <div className="ez-alert warn"><AlertTriangle size={15} /><div>{e.avisos.slice(0, 8).map(a => <p key={a}>{a}</p>)}{e.avisos.length > 8 && <p>… e mais {e.avisos.length - 8} avisos.</p>}</div></div>}
      <Grade e={e} ids={ids} onToggle={(pid, i) => mudarAberta(d => alternarCelula(d, pid, i))} />
      <p className="ez-legend">{legenda(e).join(' · ')} · F = folga · FE = férias · ▨ = fechado</p>
    </Card> : <Vazio>Gere uma escala ou abra uma salva.</Vazio>}
  </div>;
}
function Grade({ e, ids, onToggle }: { e: EscalaDados; ids: string[]; onToggle: (pid: string, i: number) => void }) {
  const setores = [...new Set(e.pessoas.filter(p => ids.includes(p.id)).map(p => p.setor))];
  const tot = (pid: string) => { let dias = 0, folgas = 0, fe = 0, min = 0; e.dias.forEach((d, i) => { if (!d.startsWith(e.mes)) return; const c = e.grade[pid]?.[i]?.c ?? 'X'; if (c === 'F' || c === 'X') folgas++; else if (c === 'FE') fe++; else { dias++; const j = e.codigos[c]; if (j) min += trabalhoJanela(j[1] - j[0]); } }); return { dias, folgas, fe, min }; };
  void semanas; void totaisSemana;
  return <div className="ez-table-wrap"><table className="ez-grade"><thead><tr><th>Funcionário</th>{e.dias.map(d => <th key={d} className={`${d.startsWith(e.mes) ? '' : 'fora'} ${diaSemana(d) === 6 ? 'dom' : ''}`}>{d.slice(8)}<small>{DIAS_LONGO[diaSemana(d)]}</small></th>)}<th>Dias</th><th>Folgas</th><th>FE</th><th>Horas</th></tr></thead>
    <tbody>{setores.map(s => { const ps = e.pessoas.filter(p => p.setor === s && ids.includes(p.id)); const st = e.setores[s]; return [<tr key={`h-${s}`} className="ez-grade-setor"><td colSpan={e.dias.length + 5}>{s}</td></tr>,
      ...ps.map(p => { const t = tot(p.id); return <tr key={p.id}><td>{p.nome}{p.contratacao && <small className="ez-badge warn">nova vaga</small>}</td>{(e.grade[p.id] ?? []).map((c, i) => { const fora = !e.dias[i]!.startsWith(e.mes); const dom = diaSemana(e.dias[i]!) === 6; const cls = c.c === 'X' ? 'x' : c.c === 'FE' ? 'fe' : c.c === 'F' ? (dom ? 'fdom' : 'f') : 'w';
        return <td key={i} className={`ez-cell ${cls} ${fora ? 'fora' : ''} ${c.e ? 'edit' : ''}`} style={cls === 'w' ? { background: corCodigo(e, c.c) } : undefined}><button type="button" disabled={fora || c.c === 'X' || c.c === 'FE'} onClick={() => onToggle(p.id, i)} title={ehTrabalho(c.c) && e.codigos[c.c] ? `${fmt(e.codigos[c.c]![0])}–${fmt(e.codigos[c.c]![1])}` : undefined}>{c.c === 'X' ? '' : c.c}</button></td>; })}
        <td className="tabular">{t.dias}</td><td className="tabular">{t.folgas}</td><td className="tabular">{t.fe}</td><td className="tabular">{fmtH(t.min)}</td></tr>; }),
      <tr key={`o-${s}`} className="ez-grade-op"><td>Setor em operação / mínimo</td>{e.dias.map((d, i) => { const n = e.pessoas.filter(p => p.setor === s && ehTrabalho(e.grade[p.id]?.[i]?.c ?? 'X')).length; const aberto = st?.horarios[diaSemana(d)]; const baixo = aberto && n < (st?.postos ?? 1); return <td key={i} className={baixo ? 'low' : ''}>{aberto ? `${n}/${st?.postos ?? 1}` : '—'}</td>; })}<td colSpan={4} /></tr>]; })}</tbody></table></div>;
}
