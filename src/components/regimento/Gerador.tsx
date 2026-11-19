import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, Moon, Printer, RotateCcw, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { CAPITULOS } from '@/data/regimento';
import { cidadeData, estadoPadrao, FECHAMENTO, INTRO, montarRegimento, nomeArquivo, nomeEmpresa, ordinal, TOTAL_ARTIGOS, type Estado, type Params, type Parte } from '@/lib/regimento/montar';
type Base = { id: string; nome?: string | null; cnpj?: string | null; cidade_uf?: string | null; aprovado_por?: string | null };
function inicial(c: Base): Estado {
  const e = estadoPadrao();
  if (c.nome?.trim()) e.empresa.nome = c.nome.trim();
  if (c.cnpj?.trim()) e.empresa.cnpj = c.cnpj.trim();
  const cid = c.cidade_uf?.split(/[/-]/)[0]?.trim(); if (cid) e.empresa.cidade = cid;
  if (c.aprovado_por?.trim()) e.empresa.representante = c.aprovado_por.trim();
  return e;
}
function Txt({ p }: { p: Parte[] }) { return <>{p.map((x, i) => x.token ? <span key={i} className="rg-token">{x.text}</span> : <span key={i}>{x.text}</span>)}</>; }
function MasterBox({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate: boolean; onChange: (v: boolean) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null); useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return <input ref={ref} type="checkbox" aria-label={label} checked={checked} onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} onChange={e => onChange(e.target.checked)} />;
}
export function GeradorRegimento({ cliente }: { cliente: Base }) {
  const chave = `regimento:${cliente.id}`;
  const [estado, setEstado] = useState<Estado>(() => inicial(cliente));
  const [carregado, setCarregado] = useState(false);
  const [abertos, setAbertos] = useState<Record<number, boolean>>(() => Object.fromEntries(CAPITULOS.map(c => [c.numero, true])));
  const [escuro, setEscuro] = useState(false);
  const [gerando, setGerando] = useState<'idle' | 'busy' | 'ok'>('idle');
  useEffect(() => {
    try { const s = localStorage.getItem(chave); if (s) { const v = JSON.parse(s) as Estado; const b = inicial(cliente); setEstado({ empresa: { ...b.empresa, ...v.empresa }, params: { ...b.params, ...v.params }, marcados: { ...b.marcados, ...v.marcados } }); } } catch { /* estado inválido: mantém padrão */ }
    try { const t = localStorage.getItem('regimento:tema'); setEscuro(t ? t === 'escuro' : matchMedia('(prefers-color-scheme: dark)').matches); } catch { /* sem acesso */ }
    setCarregado(true);
  }, [chave]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (carregado) try { localStorage.setItem(chave, JSON.stringify(estado)); } catch { /* armazenamento indisponível */ } }, [estado, carregado, chave]);
  const m = useMemo(() => montarRegimento(estado), [estado]);
  const e = estado.empresa; const emp = nomeEmpresa(e); const cd = cidadeData(e);
  const setEmp = (k: keyof Estado['empresa'], v: string) => setEstado(s => ({ ...s, empresa: { ...s.empresa, [k]: v } }));
  const setPar = (k: keyof Params, v: string) => setEstado(s => ({ ...s, params: { ...s.params, [k]: Math.max(0, Number(v) || 0) } }));
  const marcar = (ids: string[], v: boolean) => setEstado(s => ({ ...s, marcados: { ...s.marcados, ...Object.fromEntries(ids.map(id => [id, v])) } }));
  function tema() { setEscuro(v => { try { localStorage.setItem('regimento:tema', v ? 'claro' : 'escuro'); } catch { /* */ } return !v; }); }
  async function pdf() {
    setGerando('busy');
    try { const { gerarRegimentoPdf } = await import('@/lib/regimento/pdf'); gerarRegimentoPdf(m, e).save(nomeArquivo(e)); setGerando('ok'); setTimeout(() => setGerando('idle'), 2000); }
    catch { setGerando('idle'); toast.error('Não foi possível gerar o PDF. Tente novamente.'); }
  }
  const param = (k: keyof Params, titulo: string, sub: string, un: string) => <div className="rg-param"><div><span>{titulo}</span><small>{sub}</small></div><div className="rg-param-in"><input type="number" min={0} aria-label={titulo} value={estado.params[k]} onChange={ev => setPar(k, ev.target.value)} /><em>{un}</em></div></div>;
  return <div className="rg" data-theme={escuro ? 'dark' : 'light'}>
    <aside className="rg-side">
      <header className="rg-side-head">
        <div className="rg-brand-row"><span className="rg-brand">ECOMMTABIL</span><button type="button" className="rg-icon" onClick={tema} aria-label={escuro ? 'Modo claro' : 'Modo escuro'}>{escuro ? <Sun size={15} /> : <Moon size={15} />}</button></div>
        <h2>Gerador de Regimento Interno</h2>
        <p>Monte o regimento marcando os artigos desejados e preenchendo os dados do cliente. A pré-visualização à direita se atualiza em tempo real.</p>
      </header>
      <section className="rg-sec"><h3>Dados da empresa</h3>
        <label>Razão social / nome fantasia<input value={e.nome} onChange={ev => setEmp('nome', ev.target.value)} /></label>
        <label>CNPJ<input className="rg-mono" value={e.cnpj} onChange={ev => setEmp('cnpj', ev.target.value)} /></label>
        <label>Cidade<input value={e.cidade} onChange={ev => setEmp('cidade', ev.target.value)} /></label>
        <label>Data<input value={e.data} onChange={ev => setEmp('data', ev.target.value)} /></label>
        <label>Representante legal<input value={e.representante} onChange={ev => setEmp('representante', ev.target.value)} /></label>
      </section>
      <section className="rg-sec"><h3>Parâmetros variáveis</h3>
        {param('tolerancia_min', 'Tolerância de ponto', 'Art. 7º — entrada + saída somadas', 'min')}
        {param('interjornada_h', 'Intervalo interjornada', 'Art. 9º — mínimo legal: 11h', 'h')}
        {param('prazo_h', 'Prazo para justificar falta', 'Art. 10º — após o retorno', 'h')}
        <div className="rg-param"><div><span>Suspensão disciplinar</span><small>Art. 28º — faixa</small></div><div className="rg-param-in"><input type="number" min={0} aria-label="Suspensão mínima" value={estado.params.susp_min} onChange={ev => setPar('susp_min', ev.target.value)} /><em>a</em><input type="number" min={0} aria-label="Suspensão máxima" value={estado.params.susp_max} onChange={ev => setPar('susp_max', ev.target.value)} /><em>dias</em></div></div>
      </section>
      <section className="rg-sec"><h3>Cláusulas do regimento</h3>
        {CAPITULOS.map(c => { const ids = c.artigos.map(a => a.id); const n = ids.filter(id => estado.marcados[id]).length; const aberto = abertos[c.numero];
          return <div key={c.numero} className="rg-cap">
            <div role="button" tabIndex={0} aria-expanded={aberto} className="rg-cap-head" onClick={() => setAbertos(s => ({ ...s, [c.numero]: !s[c.numero] }))} onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setAbertos(s => ({ ...s, [c.numero]: !s[c.numero] })); } }}>
              <MasterBox label={`Marcar todo o capítulo ${c.numero}`} checked={n === ids.length} indeterminate={n > 0 && n < ids.length} onChange={v => marcar(ids, v)} />
              <span className="rg-cap-tag">CAP. {c.numero}</span><span className="rg-cap-title">{c.titulo}</span><span className="rg-pill">{n}/{ids.length}</span><ChevronDown size={16} className={`rg-chev ${aberto ? 'open' : ''}`} />
            </div>
            {aberto && <div className="rg-cap-body">{c.artigos.map(a => { const t = a.texto.replace(/\{\{\w+\}\}/g, '…'); return <label key={a.id} className={`rg-art ${estado.marcados[a.id] ? '' : 'off'}`}><input type="checkbox" checked={!!estado.marcados[a.id]} onChange={ev => marcar([a.id], ev.target.checked)} /><span>{t.length > 92 ? `${t.slice(0, 92).trimEnd()}…` : t}</span></label>; })}</div>}
          </div>; })}
      </section>
      <button type="button" className="rg-reset" onClick={() => setEstado(inicial(cliente))}><RotateCcw size={13} />Restaurar padrão</button>
    </aside>
    <div className="rg-main">
      <div className="rg-bar"><span className="rg-badge">{m.total} / {TOTAL_ARTIGOS} artigos</span><span className="rg-bar-sub">{CAPITULOS.length} capítulos</span><span className="rg-spacer" />
        <button type="button" className="rg-primary" onClick={pdf} disabled={gerando === 'busy' || !m.total}>{gerando === 'busy' ? <><Loader2 size={15} className="animate-spin" />Gerando…</> : gerando === 'ok' ? <><Check size={15} />PDF salvo!</> : <><Printer size={15} />Gerar PDF</>}</button></div>
      {!m.total ? <div className="rg-sheet rg-vazio">Nenhum artigo selecionado. Marque cláusulas na coluna à esquerda para montar o regimento.</div> :
      <article className="rg-sheet">
        <header className="rg-timbre"><h1>{emp}</h1>{e.cnpj.trim() && <p className="rg-mono rg-cnpj">CNPJ: {e.cnpj.trim()}</p>}<h2>REGIMENTO INTERNO</h2><p className="rg-sub">Normas e diretrizes para colaboradores</p>{cd && <p className="rg-cd">{cd}</p>}</header>
        {INTRO.map(p => <p key={p} className="rg-intro">{p}</p>)}
        {(m.pode.length > 0 || m.naoPode.length > 0) && <section className="rg-resumo"><p className="rg-eyebrow">GUIA RÁPIDO</p><h3>Resumo — o que pode e o que não pode</h3><div className="rg-cols">
          {([['Pode / direito do colaborador', 'ok', m.pode], ['Não pode / é proibido', 'bad', m.naoPode]] as const).map(([t, k, itens]) => <div key={k}><h4 className={k}><i />{t}</h4>{itens.length ? <ul>{itens.map(it => <li key={it.numero}><Txt p={it.partes} /> <span className="rg-ref">{ordinal(it.numero)}</span></li>)}</ul> : <p className="rg-none">Nenhum item nesta seleção.</p>}</div>)}
        </div></section>}
        {m.capitulos.map(c => <section key={c.numero} className="rg-chapter"><p className="rg-eyebrow">CAPÍTULO {c.numero}</p><h3>{c.titulo.toUpperCase()}</h3>{c.artigos.map(a => <p key={a.id} className="rg-artigo"><strong>{ordinal(a.numero)}.</strong> <Txt p={a.partes} /></p>)}</section>)}
        <div className="rg-fecho"><p>{FECHAMENTO}</p>{cd && <p>{cd}.</p>}</div>
        <div className="rg-assina"><span /><strong>{emp}{e.cnpj.trim() ? ` — CNPJ: ${e.cnpj.trim()}` : ''}</strong><p>{e.representante.trim() || 'Representante'} — Representante Legal</p></div>
      </article>}
    </div>
  </div>;
}
