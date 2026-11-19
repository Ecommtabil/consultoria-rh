import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Moon, Plus, Printer, RotateCcw, Sun, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { capitulosDe, cidadeData, estadoPadrao, montarRegimento, nomeArquivo, nomeEmpresa, ordinal, REGIMENTO, totalArtigos, type ClienteBase, type Estado, type Modelo, type Parte, type Resumo } from '@/lib/regimento/montar';
const inicial = (m: Modelo, c: ClienteBase) => estadoPadrao(m, c);
function Txt({ p }: { p: Parte[] }) { return <>{p.map((x, i) => x.token ? <span key={i} className="rg-token">{x.text}</span> : <span key={i}>{x.text}</span>)}</>; }
function MasterBox({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate: boolean; onChange: (v: boolean) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null); useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return <input ref={ref} type="checkbox" aria-label={label} checked={checked} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} onChange={e => onChange(e.target.checked)} />;
}
export function GeradorRegimento({ cliente, modelo = REGIMENTO }: { cliente: ClienteBase; modelo?: Modelo }) {
  const chave = `${modelo.id}:${cliente.id}`;
  const [estado, setEstado] = useState<Estado>(() => inicial(modelo, cliente));
  const [carregado, setCarregado] = useState(false);
  const [abertos, setAbertos] = useState<Record<number, boolean>>(() => Object.fromEntries(modelo.capitulos.map(c => [c.numero, true])));
  const [escuro, setEscuro] = useState(false);
  const [gerando, setGerando] = useState<'idle' | 'busy' | 'ok'>('idle');
  useEffect(() => {
    try { const s = localStorage.getItem(chave); if (s) { const v = JSON.parse(s) as Estado; const b = inicial(modelo, cliente); setEstado({ empresa: { ...b.empresa, ...v.empresa }, params: { ...b.params, ...v.params }, marcados: { ...b.marcados, ...v.marcados }, extras: v.extras ?? [], capsExtras: v.capsExtras ?? [] }); } } catch { /* estado inválido: mantém padrão */ }
    try { const t = localStorage.getItem('regimento:tema'); setEscuro(t ? t === 'escuro' : matchMedia('(prefers-color-scheme: dark)').matches); } catch { /* sem acesso */ }
    setCarregado(true);
  }, [chave]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (carregado) try { localStorage.setItem(chave, JSON.stringify(estado)); } catch { /* armazenamento indisponível */ } }, [estado, carregado, chave]);
  const m = useMemo(() => montarRegimento(estado, modelo), [estado, modelo]);
  const caps = useMemo(() => capitulosDe(modelo, estado), [modelo, estado]);
  const total = totalArtigos(modelo, estado);
  const e = estado.empresa; const emp = nomeEmpresa(e); const cd = cidadeData(e);
  const setEmp = (k: keyof Estado['empresa'], v: string) => setEstado(s => ({ ...s, empresa: { ...s.empresa, [k]: v } }));
  const setPar = (k: string, v: string, num: boolean) => setEstado(s => ({ ...s, params: { ...s.params, [k]: num ? Math.max(0, Number(v) || 0) : v } }));
  const novoId = () => `${modelo.prefixoExtra}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  function addArtigo(cap: number, texto: string, resumo?: Resumo) { const id = novoId(); setEstado(s => ({ ...s, extras: [...s.extras, { id, cap, texto, ...(resumo ? { resumo } : {}) }], marcados: { ...s.marcados, [id]: true } })); }
  const delArtigo = (id: string) => setEstado(s => ({ ...s, extras: s.extras.filter(a => a.id !== id) }));
  function addCap(titulo: string) { const numero = Math.max(...caps.map(c => c.numero)) + 1; setEstado(s => ({ ...s, capsExtras: [...s.capsExtras, { numero, titulo: titulo.toUpperCase() }] })); setAbertos(a => ({ ...a, [numero]: true })); }
  const delCap = (numero: number) => setEstado(s => ({ ...s, capsExtras: s.capsExtras.filter(c => c.numero !== numero), extras: s.extras.filter(a => a.cap !== numero) }));
  const marcar = (ids: string[], v: boolean) => setEstado(s => ({ ...s, marcados: { ...s.marcados, ...Object.fromEntries(ids.map(id => [id, v])) } }));
  function tema() { setEscuro(v => { try { localStorage.setItem('regimento:tema', v ? 'claro' : 'escuro'); } catch { /* */ } return !v; }); }
  async function pdf() {
    setGerando('busy');
    try { const { gerarRegimentoPdf } = await import('@/lib/regimento/pdf'); gerarRegimentoPdf(m, e, modelo).save(nomeArquivo(e, modelo)); setGerando('ok'); setTimeout(() => setGerando('idle'), 2000); }
    catch { setGerando('idle'); toast.error('Não foi possível gerar o PDF. Tente novamente.'); }
  }
  return <div className="rg" data-theme={escuro ? 'dark' : 'light'}>
    <aside className="rg-side">
      <header className="rg-side-head">
        <div className="rg-brand-row"><span className="rg-brand">ECOMMTABIL</span><button type="button" className="rg-icon" onClick={tema} aria-label={escuro ? 'Modo claro' : 'Modo escuro'}>{escuro ? <Sun size={15} /> : <Moon size={15} />}</button></div>
        <h2>{modelo.nomeGerador}</h2>
        <p>Monte o documento marcando os artigos desejados e preenchendo os dados do cliente. A pré-visualização à direita se atualiza em tempo real.</p>
      </header>
      <section className="rg-sec"><h3>Dados da empresa</h3>
        <label>Razão social / nome fantasia<input value={e.nome} onChange={ev => setEmp('nome', ev.target.value)} /></label>
        <label>CNPJ<input className="rg-mono" value={e.cnpj} onChange={ev => setEmp('cnpj', ev.target.value)} /></label>
        <label>Cidade<input value={e.cidade} onChange={ev => setEmp('cidade', ev.target.value)} /></label>
        <label>Data<input value={e.data} onChange={ev => setEmp('data', ev.target.value)} /></label>
        <label>Representante legal<input value={e.representante} onChange={ev => setEmp('representante', ev.target.value)} /></label>
      </section>
      <section className="rg-sec"><h3>Parâmetros variáveis</h3>
        {modelo.linhas.map(l => <div key={l.titulo} className={`rg-param ${l.largo ? 'largo' : ''}`}><div><span>{l.titulo}</span><small>{l.sub}</small></div><div className="rg-param-in">{l.campos.map(c => <span key={c.key} className="rg-campo">{c.tipo === 'num' ? <input type="number" min={0} aria-label={c.aria} value={Number(estado.params[c.key] ?? 0)} onChange={ev => setPar(c.key, ev.target.value, true)} /> : c.key === 'mensagem' ? <textarea aria-label={c.aria} rows={3} value={String(estado.params[c.key] ?? '')} onChange={ev => setPar(c.key, ev.target.value, false)} /> : <input aria-label={c.aria} value={String(estado.params[c.key] ?? '')} onChange={ev => setPar(c.key, ev.target.value, false)} />}{c.un && <em>{c.un}</em>}</span>)}</div></div>)}
      </section>
      <section className="rg-sec"><h3>Cláusulas do regimento</h3>
        {caps.map(c => { const ids = c.artigos.map(a => a.id); const n = ids.filter(id => estado.marcados[id]).length; const aberto = abertos[c.numero];
          return <div key={c.numero} className="rg-cap">
            <div role="button" tabIndex={0} aria-expanded={aberto} className="rg-cap-head" onClick={() => setAbertos(s => ({ ...s, [c.numero]: !s[c.numero] }))} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setAbertos(s => ({ ...s, [c.numero]: !s[c.numero] })); } }}>
              <MasterBox label={`Marcar todo o capítulo ${c.numero}`} checked={n === ids.length} indeterminate={n > 0 && n < ids.length} onChange={v => marcar(ids, v)} />
              <span className="rg-cap-tag">CAP. {c.numero}</span><span className="rg-cap-title">{c.titulo}</span><span className="rg-pill">{n}/{ids.length}</span><ChevronDown size={16} className={`rg-chev ${aberto ? 'open' : ''}`} />
            </div>
            {aberto && <div className="rg-cap-body">{c.artigos.map(a => { const t = a.texto.replace(/\{\{\w+\}\}/g, '…'); const extra = estado.extras.some(x => x.id === a.id); return <div key={a.id} className="rg-art-row"><label className={`rg-art ${estado.marcados[a.id] ? '' : 'off'}`}><input type="checkbox" checked={!!estado.marcados[a.id]} onChange={ev => marcar([a.id], ev.target.checked)} /><span>{extra && <b className="rg-novo">NOVO</b>}{t.length > 92 ? `${t.slice(0, 92).trimEnd()}…` : t}</span></label>{extra && <button type="button" className="rg-icon" aria-label="Excluir artigo incluído" onClick={() => delArtigo(a.id)}><Trash2 size={13} /></button>}</div>; })}<NovoArtigo onAdd={(t, r) => addArtigo(c.numero, t, r)} />{c.extra && <button type="button" className="rg-reset" onClick={() => delCap(c.numero)}><Trash2 size={12} />Excluir capítulo</button>}</div>}
          </div>; })}
        <NovoCapitulo onAdd={addCap} />
      </section>
      <button type="button" className="rg-reset" onClick={() => { if (!estado.extras.length || confirm('Restaurar o padrão remove os artigos e capítulos incluídos. Continuar?')) setEstado(inicial(modelo, cliente)); }}><RotateCcw size={13} />Restaurar padrão</button>
    </aside>
    <div className="rg-main">
      <div className="rg-bar"><span className="rg-badge">{m.total} / {total} artigos</span><span className="rg-bar-sub">{caps.length} capítulos</span><span className="rg-spacer" />
        <button type="button" className="rg-primary" onClick={pdf} disabled={gerando === 'busy' || !m.total}>{gerando === 'busy' ? <><Loader2 size={15} className="animate-spin" />Gerando…</> : gerando === 'ok' ? <><Check size={15} />PDF salvo!</> : <><Printer size={15} />Gerar PDF</>}</button></div>
      {!m.total ? <div className="rg-sheet rg-vazio">Nenhum artigo selecionado. Marque cláusulas na coluna à esquerda para montar o documento.</div> :
      <article className="rg-sheet">
        <header className="rg-timbre"><h1>{emp}</h1>{e.cnpj.trim() && <p className="rg-mono rg-cnpj">CNPJ: {e.cnpj.trim()}</p>}<h2>{modelo.tituloDoc}</h2><p className="rg-sub">{modelo.subtituloDoc}</p>{cd && <p className="rg-cd">{cd}</p>}</header>
        {m.intro.map((p, i) => <p key={i} className="rg-intro"><Txt p={p} /></p>)}
        {(m.pode.length > 0 || m.naoPode.length > 0) && <section className="rg-resumo"><p className="rg-eyebrow">GUIA RÁPIDO</p><h3>Resumo — o que pode e o que não pode</h3><div className="rg-cols">
          {([['Pode / direito do colaborador', 'ok', m.pode], ['Não pode / é proibido', 'bad', m.naoPode]] as const).map(([t, k, itens]) => <div key={k}><h4 className={k}><i />{t}</h4>{itens.length ? <ul>{itens.map(it => <li key={it.numero}><Txt p={it.partes} /> <span className="rg-ref">{ordinal(it.numero)}</span></li>)}</ul> : <p className="rg-none">Nenhum item nesta seleção.</p>}</div>)}
        </div></section>}
        {m.capitulos.map(c => <section key={c.numero} className="rg-chapter"><p className="rg-eyebrow">CAPÍTULO {c.numero}</p><h3>{c.titulo.toUpperCase()}</h3>{c.artigos.map(a => <p key={a.id} className="rg-artigo"><strong>{ordinal(a.numero)}.</strong> <Txt p={a.partes} /></p>)}</section>)}
        <div className="rg-fecho"><p>{modelo.fechamento}</p>{cd && <p>{cd}.</p>}</div>
        <div className="rg-assina"><span /><strong>{emp}{e.cnpj.trim() ? ` — CNPJ: ${e.cnpj.trim()}` : ''}</strong><p>{e.representante.trim() || 'Representante'} — Representante Legal</p></div>
      </article>}
    </div>
  </div>;
}

function NovoArtigo({ onAdd }: { onAdd: (texto: string, resumo?: Resumo) => void }) {
  const [aberto, setAberto] = useState(false); const [texto, setTexto] = useState(''); const [tipo, setTipo] = useState<'' | Resumo['tipo']>(''); const [resumo, setResumo] = useState('');
  if (!aberto) return <button type="button" className="rg-add" onClick={() => setAberto(true)}><Plus size={13} />Incluir artigo</button>;
  return <div className="rg-form"><textarea autoFocus rows={3} aria-label="Texto do novo artigo" placeholder="Texto do novo artigo" value={texto} onChange={e => setTexto(e.target.value)} />
    <select aria-label="Entra no resumo?" value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)}><option value="">Não entra no resumo</option><option value="pode">Resumo: pode</option><option value="nao_pode">Resumo: não pode</option></select>
    {tipo && <input aria-label="Frase do resumo" placeholder="Frase curta para o resumo" value={resumo} onChange={e => setResumo(e.target.value)} />}
    <div className="rg-form-actions"><button type="button" className="rg-reset" onClick={() => { setAberto(false); setTexto(''); setTipo(''); setResumo(''); }}>Cancelar</button><button type="button" className="rg-primary sm" disabled={!texto.trim() || (!!tipo && !resumo.trim())} onClick={() => { onAdd(texto.trim(), tipo ? { tipo, texto: resumo.trim() } : undefined); setAberto(false); setTexto(''); setTipo(''); setResumo(''); }}>Adicionar</button></div></div>;
}
function NovoCapitulo({ onAdd }: { onAdd: (titulo: string) => void }) {
  const [titulo, setTitulo] = useState('');
  return <div className="rg-form rg-novo-cap"><input aria-label="Título do novo capítulo" placeholder="Título do novo capítulo" value={titulo} onChange={e => setTitulo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && titulo.trim()) { onAdd(titulo.trim()); setTitulo(''); } }} /><button type="button" className="rg-primary sm" disabled={!titulo.trim()} onClick={() => { onAdd(titulo.trim()); setTitulo(''); }}><Plus size={13} />Incluir capítulo</button></div>;
}
