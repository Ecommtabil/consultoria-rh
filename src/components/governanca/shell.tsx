import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Upload, Users, FileText, CalendarDays, ChartNoAxesCombined, ShieldCheck, ChevronDown, Moon, Sun, LogOut, ArrowUpRight, LockKeyhole, FolderOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useApp } from './provider';
import { supabase } from '@/integrations/supabase/client';
const stages=[
  {to:'/importar',label:'Importar dados',icon:Upload},
  {to:'/empresa',label:'Empresa e equipe',icon:Users},
  {to:'/documentos',label:'Documentos',icon:FileText},
  {to:'/escala',label:'Escala de trabalho',icon:CalendarDays},
  {to:'/cargos',label:'Cargos e salários',icon:ChartNoAxesCombined},
] as const;
export function Brand(){return <div className="brand"><span className="brand-symbol"><ShieldCheck size={25}/></span><div><strong>Kit Governança</strong><span>INTERNA</span></div></div>;}
export function Shell({children}:{children:ReactNode}){
  const {user,clients,selected,select,dark,toggleDark}=useApp();
  const pathname=useLocation({select:location=>location.pathname});
  const navigate=useNavigate();const qc=useQueryClient();
  async function logout(){await qc.cancelQueries();qc.clear();await supabase.auth.signOut();await navigate({to:'/auth',replace:true});}
  return <div className="app-shell">
    <aside className="sidebar"><Link to="/" className="brand-link"><Brand/></Link>
      <div className="sidebar-nav"><p className="nav-caption">ÁREA DE TRABALHO</p><Button asChild variant="ghost" className={`nav-item ${pathname==='/'||pathname==='/clientes'?'active':''}`}><Link to="/clientes"><Building2/>Meus clientes<span className="nav-count">{clients.length}</span></Link></Button>
      <div className="nav-divider"/><p className="nav-caption">KIT DO CLIENTE</p><nav className="stages">{stages.map(({to,label,icon:Icon},i)=><Button asChild variant="ghost" key={to} className={`nav-item stage ${pathname===to?'active':''}`}><Link to={to}><span className="step-number">{i+1}</span><Icon/><span>{label}</span>{i>1&&<span className="stage-dot"/>}</Link></Button>)}</nav></div>
      <div className="sidebar-bottom"><div className="confidential"><LockKeyhole size={16}/><div><strong>Seu espaço, protegido.</strong><p>Dados separados por cliente.</p></div></div><div className="sidebar-footer">RH & CONTABILIDADE<span>v1.0</span></div></div>
    </aside>
    <div className="workspace"><header className="topbar"><div className="client-select"><Building2 size={18}/><div><label htmlFor="client-selector">CLIENTE SELECIONADO</label><div className="select-wrap"><select id="client-selector" value={selected?.id??''} onChange={e=>select(e.target.value)}><option value="" disabled>{user?'Selecione um cliente':'Nenhum cliente selecionado'}</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select><ChevronDown size={14}/></div></div></div><div className="topbar-actions"><span className="private-label"><ShieldCheck size={14}/>Ambiente privado</span><Button variant="ghost" size="icon" onClick={toggleDark} title={dark?'Modo claro':'Modo escuro'} aria-label={dark?'Modo claro':'Modo escuro'}>{dark?<Sun/>:<Moon/>}</Button><span className="topbar-divider"/>{user?<><span className="user-avatar" title={user.email}>{user.email?.slice(0,2).toUpperCase()}</span><Button variant="ghost" size="icon" title="Sair" aria-label="Sair" onClick={logout}><LogOut/></Button></>:<Button asChild variant="outline" size="sm"><Link to="/auth">Entrar<ArrowUpRight/></Link></Button>}</div></header>
    <main>{children}</main><footer className="workspace-footer"><span>Kit Governança Interna</span><span>Organização que sustenta boas relações.</span><ShieldCheck size={16}/></footer></div>
  </div>;
}
export function PageHeading({eyebrow,title,description,action}:{eyebrow:string;title:string;description?:string | undefined;action?:ReactNode}){return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description&&<p className="page-description">{description}</p>}</div>{action}</div>;}
export function NoClient(){return <div className="no-client"><FolderOpen size={40}/><h2>Nenhum cliente selecionado</h2><Button asChild><Link to="/clientes">Ir para meus clientes</Link></Button></div>;}