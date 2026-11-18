import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Cliente } from '@/lib/governanca';

type AppContext = { user: User | null; ready: boolean; clients: Cliente[]; loading: boolean; error: Error | null; selected: Cliente | undefined; select: (id:string)=>void; refresh:()=>Promise<void>; dark:boolean; toggleDark:()=>void; saveState:SaveState; setSaveState:(s:SaveState)=>void };
export type SaveState='idle'|'saving'|'saved'|'error';
const Context = createContext<AppContext | null>(null);
export const clientsOptions = (userId: string | undefined) => ({queryKey:['clientes',userId],queryFn:async()=>{ const {data,error}=await supabase.from('clientes').select('*').order('criado_em',{ascending:false}); if(error)throw error; return data ?? []; },enabled:!!userId});
export function AppProvider({children}:{children:ReactNode}) {
  const [user,setUser]=useState<User|null>(null);
  const [ready,setReady]=useState(false);
  const [selectedId,setSelectedId]=useState('');
  const [dark,setDark]=useState(false);
  const [saveState,setSaveState]=useState<SaveState>('idle');
  const queryClient=useQueryClient(); const router=useRouter();
  useEffect(()=>{
    let active=true;
    supabase.auth.getUser().then(({data})=>{if(active){setUser(data.user);setReady(true);}});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if(!['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event))return;
      setUser(session?.user ?? null); setReady(true);
      if(event==='SIGNED_OUT')setSelectedId('');
      router.invalidate(); if(event!=='SIGNED_OUT')queryClient.invalidateQueries();
    });
    setDark(localStorage.getItem('governanca-theme')==='dark');
    return()=>{active=false;subscription.unsubscribe();};
  },[queryClient,router]);
  useEffect(()=>{document.documentElement.classList.toggle('dark',dark);},[dark]);
  const {data:clients=[],isLoading,error}=useQuery(clientsOptions(user?.id));
  const selected=clients.find(c=>c.id===selectedId) ?? clients[0];
  return <Context.Provider value={{user,ready,clients,loading:isLoading,error,selected,select:setSelectedId,refresh:async()=>{await queryClient.invalidateQueries({queryKey:['clientes']});},saveState,setSaveState,dark,toggleDark:()=>setDark(value=>{localStorage.setItem('governanca-theme',value?'light':'dark');return !value;})}}>{children}</Context.Provider>;
}
export function useApp(){const context=useContext(Context);if(!context)throw new Error('AppProvider ausente');return context;}