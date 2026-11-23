import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Upload, Users, FileText, CalendarDays, ChartNoAxesCombined, ShieldCheck, ChevronDown, Moon, Sun, LogOut, ArrowUpRight, FolderOpen, Plus, Check, Loader2, AlertCircle, Scale, BarChart3, UserSearch } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useApp } from './provider';
import { SideRail } from './SideRail';
import { supabase } from '@/integrations/supabase/client';
const menus=[
  {label:'Clientes',icon:Building2,items:[{to:'/clientes',label:'Meus clientes',icon:Building2},{to:'/importar',label:'Importar dados',icon:Upload},{to:'/empresa',label:'Empresa e equipe',icon:Users}]},
  {label:'Conformidade trabalhista',icon:Scale,items:[{to:'/conformidade',label:'Conformidade trabalhista',icon:Scale}]},
  {label:'Normas e políticas internas',icon:FileText,items:[{to:'/documentos',label:'Normas e políticas internas',icon:FileText}]},
  {label:'Jornadas e escalas',icon:CalendarDays,items:[{to:'/escala',label:'Escalas e dimensionamento',icon:CalendarDays}]},
  {label:'Remuneração e incentivos',icon:ChartNoAxesCombined,items:[{to:'/cargos',label:'Cargos e salários',icon:ChartNoAxesCombined}]},
  {label:'Recrutamento e seleção',icon:UserSearch,items:[{to:'/recrutamento',label:'Recrutamento e seleção',icon:UserSearch}]},
  {label:'Indicadores de RH',icon:BarChart3,items:[{to:'/indicadores',label:'Indicadores de RH',icon:BarChart3}]},
] as const;
const isActive=(p:string,to:string)=>p===to||p.startsWith(`${to}/`)||(to==='/clientes'&&p==='/');
export function Brand(){return <div className="brand"><span className="brand-symbol"><ShieldCheck size={20}/></span><div><strong>Kit Governança</strong><span>INTERNA</span></div></div>;}
function SaveIndicator(){const {saveState}=useApp();
  if(saveState==='saving')return <span className="save-indicator saving" role="status"><Loader2 size={13} className="animate-spin"/>Salvando…</span>;
  if(saveState==='error')return <span className="save-indicator error" role="status"><AlertCircle size={13}/>Erro ao salvar</span>;
  return <span className="save-indicator" role="status"><Check size={13}/>Salvo</span>;}
export function Shell({children}:{children:ReactNode}){
  const {user,clients,selected,select,dark,toggleDark}=useApp();
  const pathname=useLocation({select:location=>location.pathname});
  const navigate=useNavigate();const qc=useQueryClient();
  const headerRef=useRef<HTMLElement>(null);
  useEffect(()=>{
    const el=headerRef.current;if(!el)return;
    const set=()=>document.documentElement.style.setProperty('--header-h',`${el.offsetHeight}px`);
    set();
    const ro=new ResizeObserver(set);ro.observe(el);
    return()=>ro.disconnect();
  },[]);
  async function logout(){await qc.cancelQueries();qc.clear();await supabase.auth.signOut();await navigate({to:'/auth',replace:true});}
  const current=menus.find(m=>m.items.some(i=>isActive(pathname,i.to)));
  return <div className="app-shell">
    <header className="app-header" ref={headerRef}>
      <div className="header-row">
        <Link to="/" className="brand-link-inline"><Brand/></Link>
        <div className="header-client">
          <div className="client-select"><Building2 size={16}/><div><label htmlFor="client-selector">CLIENTE</label><div className="select-wrap"><select id="client-selector" value={selected?.id??''} onChange={e=>select(e.target.value)}><option value="" disabled>{user?'Selecione um cliente':'Nenhum cliente'}</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select><ChevronDown size={14}/></div></div></div>
          <Button asChild size="sm"><Link to="/clientes"><Plus/>Novo cliente</Link></Button>
        </div>
        <div className="header-spacer"/>
        {user&&<SaveIndicator/>}
        <Button variant="ghost" size="icon" onClick={toggleDark} title={dark?'Modo claro':'Modo escuro'} aria-label={dark?'Modo claro':'Modo escuro'}>{dark?<Sun/>:<Moon/>}</Button>
        {user?<><span className="user-avatar" title={user.email}>{user.email?.slice(0,2).toUpperCase()}</span><Button variant="ghost" size="icon" title="Sair" aria-label="Sair" onClick={logout}><LogOut/></Button></>:<Button asChild variant="outline" size="sm"><Link to="/auth">Entrar<ArrowUpRight/></Link></Button>}
      </div>
      <nav className="main-tabs" aria-label="Menus principais">
        {menus.map(m=>{const Icon=m.icon;return <Link key={m.label} to={m.items[0].to} className={`main-tab ${m.items.some(i=>isActive(pathname,i.to))?'active':''}`}><Icon/>{m.label}</Link>;})}
      </nav>
    </header>
    <div className="workspace">
      {current&&current.items.length>1&&<SideRail caption={current.label}>
        {current.items.map(({to,label,icon:Icon})=><Link key={to} to={to} className={`side-rail-item ${isActive(pathname,to)?'active':''}`}><Icon/><span>{label}</span>{to==='/clientes'&&<span className="nav-count">{clients.length}</span>}</Link>)}
      </SideRail>}
      <div className="workspace-body"><main>{children}</main><footer className="workspace-footer"><span>Kit Governança Interna</span><span>Organização que sustenta boas relações.</span><ShieldCheck size={16}/></footer></div>
    </div>
  </div>;
}
export function PageHeading({eyebrow,title,description,action}:{eyebrow:string;title:string;description?:string | undefined;action?:ReactNode}){return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description&&<p className="page-description">{description}</p>}</div>{action}</div>;}
export function NoClient(){return <div className="no-client"><FolderOpen size={40}/><h2>Nenhum cliente selecionado</h2><Button asChild><Link to="/clientes">Ir para meus clientes</Link></Button></div>;}
