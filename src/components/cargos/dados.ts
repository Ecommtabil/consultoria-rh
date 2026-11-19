import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { letras, steps, amplitude, porFamilia, parseCargosPlanilha, type CargoLinha } from '@/lib/cargos/calc';
import type { Tables } from '@/integrations/supabase/types';
export type Cargo = Tables<'cargos'>;
export function useCargos(clienteId: string) {
  const qc = useQueryClient();
  const cargos = useQuery({ queryKey: ['cargos', clienteId], queryFn: async () => { const { data, error } = await supabase.from('cargos').select('*').eq('cliente_id', clienteId).order('familia').order('nivel'); if (error) throw error; return data ?? []; } });
  const cfg = useQuery({ queryKey: ['config_cargos', clienteId], queryFn: async () => { const { data, error } = await supabase.from('config_cargos').select('*').eq('cliente_id', clienteId).maybeSingle(); if (error) throw error; return data; } });
  const n = Math.min(10, Math.max(1, cfg.data?.steps ?? 5)); const pct = Number(cfg.data?.pct_entre_steps ?? 4);
  return { cargos: cargos.data ?? [], loading: cargos.isLoading, n, pct, refresh: () => qc.invalidateQueries({ queryKey: ['cargos', clienteId] }), refreshCfg: () => qc.invalidateQueries({ queryKey: ['config_cargos', clienteId] }) };
}
export function baixarModeloCargos() {
  const b = XLSX.utils.book_new();
  const sh = XLSX.utils.aoa_to_sheet([['Família', 'Cargo', 'Nível', 'Trilha', 'Salário base', 'Tempo mínimo (meses)', 'Requisitos'], ['Administrativo', 'Assistente Administrativo I', 1, 'Técnica', 2200, 12, 'Ensino médio completo']]);
  sh['!cols'] = [20, 32, 8, 12, 14, 20, 40].map(wch => ({ wch })); XLSX.utils.book_append_sheet(b, sh, 'Cargos');
  XLSX.utils.book_append_sheet(b, XLSX.utils.aoa_to_sheet([['Instruções'], ['Uma linha por cargo. Família agrupa os cargos (ex.: Administrativo, Vendas).'], ['Nível: número inteiro (1, 2, 3…). Trilha: Técnica ou Gestão.'], ['Salário base: número ou texto como “R$ 3.500,00”.'], ['Tempo mínimo: meses no cargo anterior antes da promoção.']]), 'Instruções');
  XLSX.writeFile(b, 'Modelo_Cargos.xlsx');
}
export async function lerPlanilhaCargos(file: File) {
  const book = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const nome = book.SheetNames.find(s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() === 'cargos') ?? book.SheetNames[0];
  const sheet = nome ? book.Sheets[nome] : undefined; if (!sheet) throw new Error('Planilha vazia.');
  return parseCargosPlanilha(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }));
}
export function exportarMatriz(cargos: CargoLinha[], n: number, pct: number, empresa: string) {
  const ls = letras(n); const amp = amplitude(n, pct);
  const rows: (string | number)[][] = [['Família', 'Cargo', 'Nível', 'Trilha', ...ls.map(l => `Step ${l}`), 'Amplitude', 'Tempo mínimo (meses)', 'Requisitos']];
  for (const g of porFamilia(cargos)) for (const c of g.cargos) rows.push([g.familia, c.cargo ?? '', c.nivel ?? '', c.trilha ?? '', ...steps(c.salario_base ?? 0, n, pct), amp, c.tempo_minimo_meses ?? 0, c.requisitos ?? '']);
  const sh = XLSX.utils.aoa_to_sheet(rows);
  for (let r = 1; r < rows.length; r++) { for (let k = 0; k < n; k++) { const cell = sh[XLSX.utils.encode_cell({ r, c: 4 + k })]; if (cell) cell.z = '"R$" #,##0.00'; } const a = sh[XLSX.utils.encode_cell({ r, c: 4 + n })]; if (a) a.z = '0.0%'; }
  sh['!cols'] = [{ wch: 22 }, { wch: 30 }, { wch: 7 }, { wch: 10 }, ...ls.map(() => ({ wch: 13 })), { wch: 11 }, { wch: 12 }, { wch: 40 }];
  const b = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(b, sh, 'Matriz salarial');
  XLSX.writeFile(b, `Matriz_Salarial_${empresa.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_')}.xlsx`);
}
