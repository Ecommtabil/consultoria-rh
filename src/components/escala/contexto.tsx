import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Json, Tables } from '@/integrations/supabase/types';
import type { Cliente } from '@/lib/governanca';
import { useApp } from '@/components/governanca/provider';
import { dimensionarSetor, lerConfig, setorDe, type Dimensionamento, type EscalaConfig, type EscalaDados, type SetorConfig } from '@/lib/escala';
export type Colaborador = Tables<'colaboradores'>;
export type Aberta = { id: string; dados: EscalaDados; sujo: boolean } | null;
type Ctx = {
  client: Cliente; cfg: EscalaConfig; patchCfg: (fn: (c: EscalaConfig) => EscalaConfig) => void; patchSetor: (s: string, p: Partial<SetorConfig>) => void;
  colabs: Colaborador[]; ferias: Tables<'ferias'>[]; cargos: Tables<'cargos'>[]; setores: string[]; loading: boolean;
  salarioDe: (c: Colaborador) => number | null; daMatriz: (c: Colaborador) => boolean; dims: Record<string, Dimensionamento>;
  aberta: Aberta; setAberta: (a: Aberta) => void; mudarAberta: (fn: (d: EscalaDados) => EscalaDados) => void;
};
const C = createContext<Ctx | null>(null);
export const colabsOptions = (id: string) => ({ queryKey: ['colaboradores', id], queryFn: async () => { const { data, error } = await supabase.from('colaboradores').select('*').eq('cliente_id', id).order('nome'); if (error) throw error; return data ?? []; } });
export const feriasOptions = (id: string) => ({ queryKey: ['ferias', id], queryFn: async () => { const { data, error } = await supabase.from('ferias').select('*').eq('cliente_id', id).order('inicio'); if (error) throw error; return data ?? []; } });
export const cargosOptions = (id: string) => ({ queryKey: ['cargos', id], queryFn: async () => { const { data, error } = await supabase.from('cargos').select('*').eq('cliente_id', id); if (error) throw error; return data ?? []; } });
export function EscalaProvider({ client, children }: { client: Cliente; children: ReactNode }) {
  const { setSaveState } = useApp();
  const [cfg, setCfg] = useState(() => lerConfig(client.escala_config)); const timer = useRef<ReturnType<typeof setTimeout> | null>(null); const latest = useRef(cfg);
  const [aberta, setAberta] = useState<Aberta>(null);
  async function flush() { if (timer.current) { clearTimeout(timer.current); timer.current = null; } const { error } = await supabase.from('clientes').update({ escala_config: latest.current as unknown as Json }).eq('id', client.id); if (error) { setSaveState('error'); toast.error(`Não foi possível salvar: ${error.message}`); } else setSaveState('saved'); }
  useEffect(() => () => { if (timer.current) void flush(); }, []);
  const patchCfg = (fn: (c: EscalaConfig) => EscalaConfig) => { setCfg(c => { const n = fn(c); latest.current = n; return n; }); setSaveState('saving'); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(flush, 700); };
  const patchSetor = (s: string, p: Partial<SetorConfig>) => patchCfg(c => ({ ...c, setores: { ...c.setores, [s]: { ...(c.setores[s] ?? {}), ...p } } }));
  const colabsQ = useQuery(colabsOptions(client.id)); const feriasQ = useQuery(feriasOptions(client.id)); const cargosQ = useQuery(cargosOptions(client.id));
  const colabs = colabsQ.data ?? []; const cargos = cargosQ.data ?? [];
  const matriz = (c: Colaborador) => { const n = (c.cargo ?? '').trim().toLowerCase(); return n ? cargos.find(k => k.cargo.trim().toLowerCase() === n)?.salario_base ?? null : null; };
  const salarioDe = (c: Colaborador) => c.salario ?? matriz(c); const daMatriz = (c: Colaborador) => c.salario == null && matriz(c) != null;
  const setores = useMemo(() => [...new Set(colabs.map(setorDe))].sort((a, b) => a.localeCompare(b)), [colabs]);
  const dims = useMemo(() => Object.fromEntries(setores.map(s => [s, dimensionarSetor(cfg, s, colabs.filter(c => setorDe(c) === s), c => salarioDe(c as Colaborador))])), [cfg, colabs, cargos, setores]);
  const mudarAberta = (fn: (d: EscalaDados) => EscalaDados) => setAberta(a => (a ? { ...a, dados: fn(a.dados), sujo: true } : a));
  return <C.Provider value={{ client, cfg, patchCfg, patchSetor, colabs, ferias: feriasQ.data ?? [], cargos, setores, loading: colabsQ.isLoading, salarioDe, daMatriz, dims, aberta, setAberta, mudarAberta }}>{children}</C.Provider>;
}
export function useEscala() { const c = useContext(C); if (!c) throw new Error('EscalaProvider ausente'); return c; }
