import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Plus, Trash2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useApp } from '@/components/governanca/provider';
import { supabase } from '@/integrations/supabase/client';
import { amplitude, brl, gerarFamilia, letras, pctBR, steps, type CargoLinha, type Importado, type Trilha } from '@/lib/cargos/calc';
import { baixarModeloCargos, lerPlanilhaCargos, useCargos, type Cargo } from './dados';
function useDebounce() { const t = useRef<ReturnType<typeof setTimeout> | null>(null); useEffect(() => () => { if (t.current) clearTimeout(t.current); }, []); return (fn: () => void) => { if (t.current) clearTimeout(t.current); t.current = setTimeout(fn, 700); }; }
export function Estrutura({ clienteId }: { clienteId: string }) {
  const { cargos, n, pct, refresh, refreshCfg, loading } = useCargos(clienteId); const { setSaveState } = useApp(); const deb = useDebounce();
  const [regra, setRegra] = useState({ n: String(n), pct: String(pct) }); useEffect(() => setRegra({ n: String(n), pct: String(pct) }), [n, pct]);
  const rn = Math.min(10, Math.max(1, Math.round(Number(regra.n) || 1))); const rp = Math.max(0, Number(regra.pct.replace(',', '.')) || 0);
  function mudaRegra(k: 'n' | 'pct', v: string) { setRegra(r => ({ ...r, [k]: v })); setSaveState('saving'); deb(async () => { const steps_ = k === 'n' ? Math.min(10, Math.max(1, Math.round(Number(v) || 1))) : rn; const p = k === 'pct' ? Math.max(0, Number(v.replace(',', '.')) || 0) : rp; const { error } = await supabase.from('config_cargos').upsert({ cliente_id: clienteId, steps: steps_, pct_entre_steps: p }); if (error) { setSaveState('error'); toast.error(error.message); } else { setSaveState('saved'); await refreshCfg(); } }); }
  const [fam, setFam] = useState({ familia: '', cargo: '', base: '', niveis: '3', pct: '15', trilha: 'Técnica' as Trilha });
  async function inserir(linhas: CargoLinha[]) { const ord = Math.max(0, ...cargos.map(c => c.ordem ?? 0)); const { error } = await supabase.from('cargos').insert(linhas.map((l, i) => ({ ...l, cliente_id: clienteId, ordem: ord + i + 1 }))); if (error) { toast.error(error.message); return false; } await refresh(); return true; }
  async function gerar() { const base = Number(fam.base.replace(/\./g, '').replace(',', '.')); if (!fam.familia.trim() || !fam.cargo.trim() || !(base > 0)) { toast.error('Preencha família, cargo base e salário do nível I.'); return; }
    const ls = gerarFamilia({ familia: fam.familia, cargo: fam.cargo, base, niveis: Number(fam.niveis) || 1, pct: Number(fam.pct.replace(',', '.')) || 0, trilha: fam.trilha }, cargos);
    if (await inserir(ls)) { toast.success(`${ls.length} cargo(s) criados em ${fam.familia}.`); setFam(f => ({ ...f, cargo: '', base: '' })); } }
  async function adicionar() { await inserir([{ familia: cargos.at(-1)?.familia ?? '', cargo: '', nivel: 1, trilha: 'Técnica', salario_base: 0, tempo_minimo_meses: 0, requisitos: '' }]); }
  async function remover(id: string) { const { error } = await supabase.from('cargos').delete().eq('id', id); if (error) toast.error(error.message); else await refresh(); }
  const input = useRef<HTMLInputElement>(null); const [prev, setPrev] = useState<Importado | null>(null); const [busy, setBusy] = useState(false);
  async function escolher(f?: File) { if (!f) return; try { const r = await lerPlanilhaCargos(f); if (!r.linhas.length) throw new Error('Nenhum cargo encontrado na planilha.'); setPrev(r); } catch (e) { toast.error((e as Error).message); } }
  async function aplicar(modo: 'substituir' | 'adicionar') { if (!prev) return; setBusy(true);
    if (modo === 'substituir') { const { error } = await supabase.from('cargos').delete().eq('cliente_id', clienteId); if (error) { toast.error(error.message); setBusy(false); return; } }
    const ok = await (async () => { const { error } = await supabase.from('cargos').insert(prev.linhas.map((l, i) => ({ ...l, cliente_id: clienteId, ordem: i + 1 + (modo === 'adicionar' ? cargos.length : 0) }))); if (error) { toast.error(error.message); return false; } await refresh(); return true; })();
    setBusy(false); if (ok) { toast.success(`${prev.linhas.length} cargo(s) importados.`); setPrev(null); } }
  const familias = [...new Set(cargos.map(c => c.familia).filter(Boolean))] as string[];
  const ex = steps(1000, rn, rp);
  return <div className="cg-stack">
    <div className="cg-grid2">
      <section className="cg-card"><h2>Regras da faixa salarial</h2>
        <div className="cg-form"><label>Steps por cargo<input type="number" min={1} max={10} value={regra.n} onChange={e => mudaRegra('n', e.target.value)} /></label><label>% entre steps<input type="number" min={0} step="0.5" value={regra.pct} onChange={e => mudaRegra('pct', e.target.value)} /></label></div>
        <p className="cg-muted">Steps {letras(rn).join(', ')} · amplitude da faixa <strong className="tabular-nums">{pctBR(amplitude(rn, rp))}</strong></p>
        <p className="cg-muted tabular-nums">Exemplo para base R$ 1.000,00: {ex.map(brl).join(' · ')}</p></section>
      <section className="cg-card"><h2>Gerar família de cargos</h2>
        <div className="cg-form">
          <label>Família<input list="cg-familias" value={fam.familia} onChange={e => setFam({ ...fam, familia: e.target.value })} placeholder="Ex.: Vendas" /></label>
          <label>Cargo base<input value={fam.cargo} onChange={e => setFam({ ...fam, cargo: e.target.value })} placeholder="Ex.: Vendedor" /></label>
          <label>Salário do nível I (R$)<input inputMode="decimal" value={fam.base} onChange={e => setFam({ ...fam, base: e.target.value })} placeholder="3.500,00" /></label>
          <label>Quantidade de níveis<input type="number" min={1} max={10} value={fam.niveis} onChange={e => setFam({ ...fam, niveis: e.target.value })} /></label>
          <label>% entre níveis<input type="number" min={0} value={fam.pct} onChange={e => setFam({ ...fam, pct: e.target.value })} /></label>
          <label>Trilha<select value={fam.trilha} onChange={e => setFam({ ...fam, trilha: e.target.value as Trilha })}><option>Técnica</option><option>Gestão</option></select></label>
        </div><Button onClick={gerar}><Wand2 />Gerar cargos</Button></section>
    </div>
    <datalist id="cg-familias">{familias.map(f => <option key={f} value={f} />)}</datalist>
    <section className="cg-card"><div className="section-heading"><div><h2>Cargos</h2><p className="cg-muted">{cargos.length} cargo(s)</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="ghost" onClick={baixarModeloCargos}><Download />Baixar planilha modelo</Button><Button variant="outline" onClick={() => input.current?.click()}><FileSpreadsheet />Importar Excel</Button><Button onClick={adicionar}><Plus />Adicionar cargo</Button>
        <input ref={input} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={e => { void escolher(e.target.files?.[0]); e.target.value = ''; }} /></div></div>
      {prev && <div className="cg-preview"><h3>Prévia da importação — {prev.linhas.length} cargo(s)</h3>
        {prev.avisos.length > 0 && <ul className="cg-alerts">{prev.avisos.map((a, i) => <li key={i}>Linha {a.linha}: {a.texto}</li>)}</ul>}
        <div className="employee-table-wrap"><table className="employee-table"><thead><tr><th>Família</th><th>Cargo</th><th>Nível</th><th>Trilha</th><th>Salário base</th><th>Tempo mín.</th></tr></thead><tbody>{prev.linhas.slice(0, 50).map((l, i) => <tr key={i}><td>{l.familia}</td><td>{l.cargo}</td><td>{l.nivel}</td><td>{l.trilha}</td><td className="tabular-nums">{l.salario_base != null ? brl(l.salario_base) : '—'}</td><td>{l.tempo_minimo_meses}</td></tr>)}</tbody></table></div>
        <div className="flex flex-wrap gap-2 mt-3"><Button disabled={busy} onClick={() => aplicar('substituir')}>Substituir cargos</Button><Button disabled={busy} variant="outline" onClick={() => aplicar('adicionar')}>Adicionar</Button><Button variant="ghost" onClick={() => setPrev(null)}>Cancelar</Button></div></div>}
      <div className="employee-table-wrap"><table className="employee-table cg-table"><thead><tr><th>Família</th><th>Cargo</th><th>Nível</th><th>Trilha</th><th>Salário base</th><th>Tempo mínimo (meses)</th><th>Requisitos</th><th /></tr></thead>
        <tbody>{cargos.map(c => <Linha key={c.id} c={c} onRemove={() => remover(c.id)} />)}</tbody></table>
        {loading ? <p className="table-empty">Carregando cargos…</p> : !cargos.length && <p className="table-empty">Nenhum cargo cadastrado. Gere uma família ou adicione um cargo.</p>}</div></section>
  </div>;
}
function Linha({ c, onRemove }: { c: Cargo; onRemove: () => void }) {
  const [d, setD] = useState(c); const { setSaveState } = useApp(); const deb = useDebounce(); const pend = useRef<Partial<Cargo>>({});
  function muda<K extends keyof Cargo>(k: K, v: Cargo[K]) { setD(x => ({ ...x, [k]: v })); pend.current = { ...pend.current, [k]: v }; setSaveState('saving');
    deb(async () => { const p = pend.current; pend.current = {}; const { error } = await supabase.from('cargos').update(p).eq('id', c.id); if (error) { setSaveState('error'); toast.error(`Não foi possível salvar: ${error.message}`); } else setSaveState('saved'); }); }
  const num = (v: string) => (v === '' ? null : Math.max(0, Number(v)));
  return <tr>
    <td><input aria-label="Família" list="cg-familias" value={d.familia ?? ''} onChange={e => muda('familia', e.target.value)} /></td>
    <td><input aria-label="Cargo" value={d.cargo ?? ''} onChange={e => muda('cargo', e.target.value)} /></td>
    <td><input aria-label="Nível" type="number" min={1} className="cg-num" value={d.nivel ?? ''} onChange={e => muda('nivel', num(e.target.value))} /></td>
    <td><select aria-label="Trilha" value={d.trilha ?? 'Técnica'} onChange={e => muda('trilha', e.target.value)}><option>Técnica</option><option>Gestão</option></select></td>
    <td><input aria-label="Salário base" type="number" min={0} step="0.01" className="cg-num cg-money" value={d.salario_base ?? ''} onChange={e => muda('salario_base', num(e.target.value))} /></td>
    <td><input aria-label="Tempo mínimo" type="number" min={0} className="cg-num" value={d.tempo_minimo_meses ?? ''} onChange={e => muda('tempo_minimo_meses', num(e.target.value))} /></td>
    <td><input aria-label="Requisitos" className="cg-req" value={d.requisitos ?? ''} onChange={e => muda('requisitos', e.target.value)} /></td>
    <td><Button variant="ghost" size="icon" aria-label="Excluir cargo" title="Excluir cargo" onClick={onRemove}><Trash2 /></Button></td></tr>;
}
