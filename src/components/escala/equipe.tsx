import { Fragment, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarPlus, ChevronDown, FileSpreadsheet, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { useApp } from '@/components/governanca/provider';
import { diasTrabalho, fmtH, janela, trabalhoJanela, ddmm } from '@/lib/escala';
import { useEscala, type Colaborador } from './contexto';
import { brl, Card, Vazio } from './ui';
const NOVAS = ['6x1-40', '6x1-42', '6x1-44', '5x2-40', '5x2-42', '5x2-44'];
const jan = (a: string | null, b: string | null) => { const j = janela(a, b); return j ? trabalhoJanela(j.fim - j.ini) : 0; };
export function resumoDia(c: Colaborador) {
  const s = (m: string, a: string | null, b: string | null) => (m === 'folga' ? 'folga' : m === 'diferente' && a && b ? `${a}–${b}` : 'igual');
  return `Semana ${c.entrada ?? '--:--'}–${c.saida ?? '--:--'} · Sáb ${s(c.sab_modo, c.sab_entrada, c.sab_saida)} · Dom ${s(c.dom_modo, c.dom_entrada, c.dom_saida)}`;
}
export function semanaTipica(c: Colaborador) {
  const d = diasTrabalho(c.jornada_atual === '5x2' ? '5x2' : '6x1'); const util = jan(c.entrada, c.saida);
  const sab = c.sab_modo === 'diferente' ? jan(c.sab_entrada, c.sab_saida) : util; const dom = c.dom_modo === 'diferente' ? jan(c.dom_entrada, c.dom_saida) : util;
  const opcoes = [util, util, util, util, util, c.sab_modo === 'folga' ? null : sab, c.dom_modo === 'folga' ? null : dom].filter((v): v is number => v !== null);
  return opcoes.slice(0, d).reduce((a, b) => a + b, 0);
}
export function EquipePage() {
  const { client, colabs, setores, ferias, loading, salarioDe, daMatriz } = useEscala(); const qc = useQueryClient(); const [aberto, setAberto] = useState<string | null>(null);
  const semSexo = colabs.filter(c => !c.sexo).length;
  const invalidar = async () => { await qc.invalidateQueries({ queryKey: ['colaboradores', client.id] }); await qc.invalidateQueries({ queryKey: ['equipe-count'] }); };
  async function add() { const { error } = await supabase.from('colaboradores').insert({ cliente_id: client.id, nome: 'Novo colaborador' }); if (error) toast.error(error.message); await invalidar(); }
  async function remove(id: string) { const { error } = await supabase.from('colaboradores').delete().eq('id', id); if (error) toast.error(error.message); await invalidar(); await qc.invalidateQueries({ queryKey: ['ferias', client.id] }); }
  return <div className="ez-stack">
    {semSexo > 0 && <p className="ez-alert warn"><AlertTriangle size={15} />{semSexo} funcionário{semSexo > 1 ? 's' : ''} sem sexo informado: a folga dominical quinzenal das mulheres (CLT art. 386) só vale para quem está marcado como Feminino.</p>}
    <Card title="Equipe e jornada atual" desc={`${colabs.length} colaboradores · mesma equipe da aba Empresa e equipe`} action={<div className="ez-actions"><Button asChild variant="outline"><Link to="/importar"><FileSpreadsheet />Importar Excel</Link></Button><Button onClick={add}><Plus />Adicionar</Button></div>}>
      <datalist id="ez-setores">{setores.map(s => <option key={s} value={s} />)}</datalist>
      <div className="ez-table-wrap"><table className="ez-table ez-edit"><thead><tr>{['Nome', 'Matrícula', 'Setor', 'Cargo', 'Sexo', 'Jornada', 'Horas', 'Nova jornada', 'Entrada', 'Saída', 'Horário por dia', 'Salário', ''].map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{colabs.map(c => <Fragment key={c.id}><Linha c={c} aberto={aberto === c.id} toggle={() => setAberto(aberto === c.id ? null : c.id)} onRemove={() => remove(c.id)} salario={salarioDe(c)} matriz={daMatriz(c)} /></Fragment>)}</tbody></table>
        {!colabs.length && <Vazio>{loading ? 'Carregando equipe…' : 'Nenhum colaborador cadastrado.'}</Vazio>}</div>
    </Card>
    <Ferias colabs={colabs} ferias={ferias} />
  </div>;
}
function Linha({ c, aberto, toggle, onRemove, salario, matriz }: { c: Colaborador; aberto: boolean; toggle: () => void; onRemove: () => void; salario: number | null; matriz: boolean }) {
  const { client } = useEscala(); const qc = useQueryClient(); const { setSaveState } = useApp(); const [d, setD] = useState(c);
  async function save(patch: TablesUpdate<'colaboradores'>) { setD(x => ({ ...x, ...patch } as Colaborador)); setSaveState('saving'); const { error } = await supabase.from('colaboradores').update(patch).eq('id', c.id); if (error) { setSaveState('error'); toast.error(`Não foi possível salvar: ${error.message}`); return; } setSaveState('saved'); await qc.invalidateQueries({ queryKey: ['colaboradores', client.id] }); }
  const txt = (k: 'nome' | 'matricula' | 'setor' | 'cargo' | 'entrada' | 'saida', type = 'text', extra = {}) => <input type={type} aria-label={k} value={d[k] ?? ''} onChange={e => setD({ ...d, [k]: e.target.value })} onBlur={e => { const v = e.target.value.trim(); if ((c[k] ?? '') !== v) void save({ [k]: k === 'nome' ? v : v || null }); }} {...extra} />;
  const tipica = semanaTipica(d); const carga = (Number(d.horas_semanais) || 0) * 60; const bate = !d.horas_semanais || !d.entrada || Math.abs(tipica - carga) < 1;
  return <><tr>
    <td>{txt('nome')}</td><td>{txt('matricula')}</td><td>{txt('setor', 'text', { list: 'ez-setores' })}</td><td>{txt('cargo')}</td>
    <td><select aria-label="Sexo" className={!d.sexo ? 'ez-warn-field' : ''} value={d.sexo ?? ''} onChange={e => save({ sexo: e.target.value || null })}><option value="">Informar</option><option value="F">Feminino</option><option value="M">Masculino</option></select></td>
    <td><select aria-label="Jornada atual" value={d.jornada_atual ?? ''} onChange={e => save({ jornada_atual: e.target.value || null })}><option value="">—</option><option value="6x1">6x1</option><option value="5x2">5x2</option></select></td>
    <td><input aria-label="Horas semanais" type="number" min={1} max={44} className="ez-num" value={d.horas_semanais ?? ''} onChange={e => setD({ ...d, horas_semanais: e.target.value === '' ? null : Number(e.target.value) })} onBlur={() => save({ horas_semanais: d.horas_semanais })} /></td>
    <td><select aria-label="Nova jornada" value={d.nova_jornada} onChange={e => save({ nova_jornada: e.target.value })}><option value="setor">Padrão do setor</option><option value="manter">Manter horário do cadastro</option>{NOVAS.map(n => <option key={n} value={n}>{n.replace('-', ' ')}h</option>)}</select></td>
    <td>{txt('entrada', 'time')}</td><td>{txt('saida', 'time')}</td>
    <td><button type="button" className="ez-sum-btn" aria-expanded={aberto} onClick={toggle}>{resumoDia(d)}<ChevronDown size={14} /></button></td>
    <td className="ez-sal"><input aria-label="Salário" type="number" min={0} step="0.01" placeholder={matriz && salario ? String(salario) : ''} value={d.salario ?? ''} onChange={e => setD({ ...d, salario: e.target.value === '' ? null : Number(e.target.value) })} onBlur={() => save({ salario: d.salario })} />{matriz && salario != null && <small>{brl(salario)} (da matriz)</small>}</td>
    <td><Button variant="ghost" size="icon" aria-label={`Excluir ${c.nome}`} onClick={onRemove}><Trash2 /></Button></td>
  </tr>{aberto && <tr className="ez-expand"><td colSpan={13}><div className="ez-days">
    {(['sab', 'dom'] as const).map(p => { const modo = d[`${p}_modo`]; return <div key={p} className="ez-day"><strong>{p === 'sab' ? 'Sábado' : 'Domingo'}</strong>
      <div className="ez-seg">{[['igual', 'Mesmo horário'], ['diferente', 'Horário diferente'], ['folga', 'Folga fixa']].map(([v, l]) => <button key={v} type="button" className={modo === v ? 'on' : ''} onClick={() => save({ [`${p}_modo`]: v })}>{l}</button>)}</div>
      {modo === 'diferente' && <div className="ez-pair"><input type="time" aria-label={`${p} entrada`} value={d[`${p}_entrada`] ?? ''} onChange={e => setD({ ...d, [`${p}_entrada`]: e.target.value })} onBlur={e => save({ [`${p}_entrada`]: e.target.value || null })} /><input type="time" aria-label={`${p} saída`} value={d[`${p}_saida`] ?? ''} onChange={e => setD({ ...d, [`${p}_saida`]: e.target.value })} onBlur={e => save({ [`${p}_saida`]: e.target.value || null })} /></div>}
    </div>; })}
    <div className={`ez-day ${bate ? '' : 'bad'}`}><strong>Semana típica</strong><p className="tabular">{fmtH(tipica)} trabalhadas{d.horas_semanais ? ` · cadastro ${d.horas_semanais}h` : ''}</p>{!bate && <p className="ez-bad-text">Não bate com as horas cadastradas.</p>}</div>
  </div></td></tr>}</>;
}
function Ferias({ colabs, ferias }: { colabs: Colaborador[]; ferias: { id: string; colaborador_id: string; inicio: string; fim: string }[] }) {
  const { client } = useEscala(); const qc = useQueryClient(); const [f, setF] = useState({ colaborador_id: '', inicio: '', fim: '' });
  const dias = f.inicio && f.fim ? Math.round((Date.parse(f.fim) - Date.parse(f.inicio)) / 864e5) + 1 : 0;
  const sobrepoe = !!f.colaborador_id && !!f.inicio && !!f.fim && ferias.some(x => x.colaborador_id === f.colaborador_id && x.inicio <= f.fim && f.inicio <= x.fim);
  async function add() { if (!f.colaborador_id || !f.inicio || !f.fim) return void toast.error('Escolha o funcionário, o início e o fim.'); if (f.fim < f.inicio) return void toast.error('O fim deve ser depois do início.'); if (sobrepoe) return void toast.error('Este período se sobrepõe a outras férias da mesma pessoa.');
    const { error } = await supabase.from('ferias').insert({ ...f, cliente_id: client.id }); if (error) return void toast.error(error.message); setF({ colaborador_id: f.colaborador_id, inicio: '', fim: '' }); await qc.invalidateQueries({ queryKey: ['ferias', client.id] }); toast.success('Férias registradas.'); }
  async function remove(id: string) { const { error } = await supabase.from('ferias').delete().eq('id', id); if (error) toast.error(error.message); await qc.invalidateQueries({ queryKey: ['ferias', client.id] }); }
  const nome = (id: string) => colabs.find(c => c.id === id)?.nome ?? '—';
  return <Card title="Férias" desc="Usadas na escala mensal como FE.">
    <div className="ez-row ez-wrap"><select aria-label="Funcionário" value={f.colaborador_id} onChange={e => setF({ ...f, colaborador_id: e.target.value })}><option value="">Funcionário…</option>{colabs.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
      <input type="date" aria-label="Início" value={f.inicio} onChange={e => setF({ ...f, inicio: e.target.value })} /><input type="date" aria-label="Fim" value={f.fim} onChange={e => setF({ ...f, fim: e.target.value })} />
      <Button onClick={add} disabled={sobrepoe}><CalendarPlus />Adicionar férias</Button></div>
    {sobrepoe && <p className="ez-alert bad"><AlertTriangle size={15} />Sobreposição com outras férias desta pessoa.</p>}
    {dias > 30 && <p className="ez-alert warn"><AlertTriangle size={15} />Período de {dias} dias: acima dos 30 dias de férias.</p>}
    {ferias.length ? <ul className="ez-list">{ferias.map(x => <li key={x.id}><span><b>{nome(x.colaborador_id)}</b> · {ddmm(x.inicio)}/{x.inicio.slice(0, 4)} a {ddmm(x.fim)}/{x.fim.slice(0, 4)}</span><Button variant="ghost" size="sm" onClick={() => remove(x.id)}><Trash2 />Remover</Button></li>)}</ul> : <Vazio>Nenhum período de férias registrado.</Vazio>}
  </Card>;
}
