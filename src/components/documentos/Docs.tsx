import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileDown, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SideRail } from '@/components/governanca/SideRail';
import { GeradorRegimento } from '@/components/regimento/Gerador';
import { MODELOS } from '@/lib/regimento/montar';
import { useApp } from '@/components/governanca/provider';
import { supabase } from '@/integrations/supabase/client';
import type { Cliente } from '@/lib/governanca';
import { montar, segmentos, NOMES, pendenciasDe, preenchido, type Bloco, type DocId, type Documento } from '@/lib/documentos/blocos';
type Sancao={id:string;ordem:number|null;situacao:string|null;medida:string|null;recorrencia:string|null};
function baixar(blob:Blob,nome:string){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=nome;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);}
export function Docs({client,inicial='regimento',somente}:{client:Cliente;inicial?:DocId;somente?:DocId}){
  const qc=useQueryClient();const {setSaveState}=useApp();
  const [aba,setAba]=useState<DocId>(somente??inicial);const [notas,setNotas]=useState(client.incluir_notas_consultor);const [modo,setModo]=useState<'branco'|'equipe'>('branco');
  const {data:sancoesDb}=useQuery({queryKey:['sancoes',client.id],queryFn:async()=>{const {data,error}=await supabase.from('sancoes').select('*').eq('cliente_id',client.id).order('ordem');if(error)throw error;return data??[];}});
  const {data:colaboradores=[]}=useQuery({queryKey:['colaboradores',client.id],queryFn:async()=>{const {data,error}=await supabase.from('colaboradores').select('*').eq('cliente_id',client.id).order('nome');if(error)throw error;return data??[];}});
  const {data:cargos=[]}=useQuery({queryKey:['cargos',client.id],queryFn:async()=>{const {data,error}=await supabase.from('cargos').select('*').eq('cliente_id',client.id).order('nivel');if(error)throw error;return data??[];}});
  const {data:cfg}=useQuery({queryKey:['config_cargos',client.id],queryFn:async()=>{const {data,error}=await supabase.from('config_cargos').select('*').eq('cliente_id',client.id).maybeSingle();if(error)throw error;return data;}});
  const [sancoes,setSancoes]=useState<Sancao[]>([]);useEffect(()=>{if(sancoesDb)setSancoes(sancoesDb);},[sancoesDb]);
  const doc=useMemo(()=>montar(aba,{cliente:{...client,incluir_notas_consultor:notas},sancoes,colaboradores,termoModo:modo,cargos,steps:cfg?.steps??5,pct:Number(cfg?.pct_entre_steps??4)}),[aba,client,notas,sancoes,colaboradores,modo,cargos,cfg]);
  async function salvar<T>(p:PromiseLike<{error:{message:string}|null;data?:T}>){setSaveState('saving');const {error}=await p;if(error){setSaveState('error');toast.error(error.message);return false;}setSaveState('saved');return true;}
  async function toggleNotas(v:boolean){setNotas(v);if(await salvar(supabase.from('clientes').update({incluir_notas_consultor:v}).eq('id',client.id)))await qc.invalidateQueries({queryKey:['clientes']});}
  async function addSancao(){const ordem=Math.max(0,...sancoes.map(s=>s.ordem??0))+1;if(await salvar(supabase.from('sancoes').insert({cliente_id:client.id,ordem,situacao:'',medida:'',recorrencia:''})))await qc.invalidateQueries({queryKey:['sancoes',client.id]});}
  async function delSancao(id:string){setSancoes(s=>s.filter(x=>x.id!==id));if(await salvar(supabase.from('sancoes').delete().eq('id',id)))await qc.invalidateQueries({queryKey:['sancoes',client.id]});}
  const editSancao=(id:string,k:'situacao'|'medida'|'recorrencia',v:string)=>setSancoes(s=>s.map(x=>x.id===id?{...x,[k]:v}:x));
  const vazio=doc.blocos.length===0;
  async function word(){try{const {gerarWord}=await import('@/lib/documentos/word');baixar(await gerarWord(doc),`${doc.arquivo}.docx`);}catch(e){toast.error(`Falha ao gerar Word: ${(e as Error).message}`);}}
  async function pdf(){try{const {gerarPdf}=await import('@/lib/documentos/pdf');gerarPdf(doc).save(`${doc.arquivo}.pdf`);}catch(e){toast.error(`Falha ao gerar PDF: ${(e as Error).message}`);}}
  const corpo = aba==='regimento'||aba==='codigo'
    ? <GeradorRegimento key={aba} cliente={client} modelo={MODELOS[aba]}/>
    : <div className="doc-layout">
      <aside className="doc-side">
        <section><h3>Pendências</h3><ul className="pend-list">{pendenciasDe(aba).map(([k,l])=>{const ok=preenchido(client[k]);return <li key={k}><span className={`pend-dot ${ok?'ok':'pend'}`} aria-hidden/>{l}<span className="sr-only">{ok?' preenchido':' pendente'}</span></li>;})}</ul>
          <Button asChild variant="outline" className="w-full"><Link to="/empresa"><Pencil/>Editar dados da empresa</Link></Button></section>
        <label className="checkbox-field"><input type="checkbox" checked={notas} onChange={e=>toggleNotas(e.target.checked)}/>Incluir notas do consultor</label>
        {aba==='termo'&&<section><h3>Modelo</h3><select className="doc-select" value={modo} onChange={e=>setModo(e.target.value as 'branco'|'equipe')} aria-label="Modelo do termo"><option value="branco">Em branco (1 página)</option><option value="equipe">Um por colaborador ({colaboradores.filter(c=>c.nome?.trim()).length})</option></select></section>}
        
        <div className="doc-actions"><Button onClick={word} disabled={vazio}><FileDown/>Baixar em Word</Button><Button variant="outline" onClick={pdf} disabled={vazio}><FileDown/>Baixar em PDF</Button></div>
      </aside>
      <Previa doc={doc}/>
    </div>;
  if(somente) return corpo;
  return <div className="rail-layout">
    <SideRail caption="Documentos">{(Object.keys(NOMES) as DocId[]).filter(id=>id!=='plano').map(id=><button key={id} type="button" className={`side-rail-item ${aba===id?'active':''}`} onClick={()=>setAba(id)}><FileText size={15}/><span>{NOMES[id]}</span></button>)}</SideRail>
    <div className="rail-body">{corpo}</div>
  </div>;
}
function T({s}:{s:string}){return <>{segmentos(s).map((p,i)=>p.ph?<mark key={i} className="doc-ph">{p.text}</mark>:<span key={i}>{p.text}</span>)}</>;}
function B({b}:{b:Bloco}){switch(b.t){
  case 'title':return <h2 className="doc-title"><T s={b.text}/></h2>;
  case 'h1':return <h3 className="doc-h1"><T s={b.text}/></h3>;
  case 'h2':return <h4 className="doc-h2"><T s={b.text}/></h4>;
  case 'p':return <p className="doc-p"><T s={b.text}/></p>;
  case 'li':return <p className="doc-li"><T s={b.text}/></p>;
  case 'note':return <p className="doc-note"><T s={b.text}/></p>;
  case 'table':return <table className="doc-table"><thead><tr>{b.head.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{b.rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}><T s={c}/></td>)}</tr>)}</tbody></table>;
  case 'fields':return <div className="doc-fields">{b.items.map(([l,v])=><div key={l}><strong>{l}:</strong><span>{v}</span></div>)}</div>;
  case 'sign':return <div className="doc-sign"><span/>{b.label}</div>;
  default:return null;}}
function Previa({doc}:{doc:Documento}){
  if(!doc.blocos.length)return <div className="doc-preview"><div className="doc-page doc-empty"><p>Nada a mostrar ainda.</p></div></div>;
  const paginas:Bloco[][]=[[]];for(const b of doc.blocos){if(b.t==='break')paginas.push([]);else paginas[paginas.length-1]!.push(b);}
  return <div className={`doc-preview ${doc.tema?.fonte==='sans'?'doc-sans':''}`} style={doc.tema?{['--petrol' as string]:`#${doc.tema.cor}`}:undefined} aria-label="Pré-visualização">
    {doc.capa&&<div className="doc-page doc-cover"><p className="cv-emp"><T s={doc.capa.empresa}/></p><h2>{doc.capa.titulo}</h2><p className="cv-sub">{doc.capa.subtitulo}</p><span className="cv-bar"/><p className="cv-meta"><T s={doc.capa.versao}/><br/><T s={doc.capa.aprovado}/></p></div>}
    {paginas.map((p,i)=><div key={i} className="doc-page"><div className="doc-head">{doc.cabecalho}</div>{p.map((b,j)=><B key={j} b={b}/>)}</div>)}
  </div>;}
