import * as XLSX from 'xlsx';
import { empresaFields, sheetSpecs, parseSheets } from './governanca';

export function downloadTemplate() {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['Campo','Valor'], ...empresaFields.map(([key]) => [key,''])]),'Empresa');
  for (const [name,spec] of Object.entries(sheetSpecs)) {
    const sheet = XLSX.utils.aoa_to_sheet([spec.map(([label]) => label)]);
    sheet['!cols'] = spec.map(() => ({wch:25}));
    XLSX.utils.book_append_sheet(book,sheet,name);
  }
  XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([
    ['Como preencher'],['Preencha as abas necessárias. Remova as abas que não deseja substituir.'],
    ['Empresa: use os campos da primeira coluna. Datas: DD/MM/AAAA; horas: HH:MM.'],
    ['Colaboradores: Setor agrupa a escala. Sexo F ou M. Jornada 6x1 ou 5x2. Horas semanais: 40, 42 ou 44.'],
    ['Entrada e Saída: horário dos dias úteis (HH:MM ou hora do Excel).'],
    ['Sábado/Domingo: em branco = mesmo horário; preenchido = horário próprio; “FOLGA” na entrada = folga fixa.'],
    ['Antes de gravar a equipe, o sistema mostra uma prévia: substituir ou adicionar à equipe atual.'],
    ['Salários: aceita números ou R$ 3.500,00. Notas do consultor: Sim ou Não.'],
    ['Cargos: Trilha Técnica ou Gestão. Nível e tempo mínimo: números inteiros.'],
]),'Como preencher');
  XLSX.writeFile(book,'Modelo_Kit_Governanca.xlsx');
}
export async function readSpreadsheet(file: File) {
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) throw new Error('Selecione um arquivo .xlsx, .xls ou .csv.');
  const book = XLSX.read(await file.arrayBuffer(), {type:'array',cellDates:false});
  return parseSheets(Object.fromEntries(book.SheetNames.map(name => { const sheet=book.Sheets[name]; if(!sheet)throw new Error('Aba ausente.'); return [name,XLSX.utils.sheet_to_json<unknown[]>(sheet,{header:1,defval:''})]; })));
}
const br = (v: unknown) => { const s = String(v ?? ''); const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); return m ? `${m[3]}/${m[2]}/${m[1]}` : s; };
/** Planilha no mesmo formato do modelo, preenchida com os dados gravados do cliente (pode ser reimportada). */
export async function exportarDadosCliente(cliente: Record<string, unknown> & { id: string; nome: string }) {
  const { supabase } = await import('@/integrations/supabase/client');
  const [col, car] = await Promise.all([
    supabase.from('colaboradores').select('*').eq('cliente_id', cliente.id).order('nome'),
    supabase.from('cargos').select('*').eq('cliente_id', cliente.id),
  ]);
  if (col.error) throw col.error; if (car.error) throw car.error;
  const book = XLSX.utils.book_new();
  const val = (k: string, t: string) => { const v = cliente[k]; if (v == null) return ''; if (t === 'date') return br(v); if (t === 'checkbox') return v ? 'Sim' : 'Não'; if (t === 'time') return String(v).slice(0, 5); return v as string | number; };
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Campo', 'Valor'], ...empresaFields.map(([k, , t]) => [k, val(k, t)])]), 'Empresa');
  const linhas: Record<string, Record<string, unknown>[]> = { Colaboradores: col.data as Record<string, unknown>[], Cargos: car.data as Record<string, unknown>[] };
  for (const [name, spec] of Object.entries(sheetSpecs)) {
    const rows = linhas[name] ?? [];
    const sheet = XLSX.utils.aoa_to_sheet([spec.map(([l]) => l), ...rows.map(r => spec.map(([, k]) => { const v = r[k]; if (v == null) return ''; if (k === 'admissao') return br(v); if (/entrada|saida/.test(k)) return String(v).slice(0, 5); return v as string | number; }))]);
    sheet['!cols'] = spec.map(() => ({ wch: 25 })); XLSX.utils.book_append_sheet(book, sheet, name);
  }
  const nome = cliente.nome.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '');
  XLSX.writeFile(book, `Dados_${nome || 'cliente'}.xlsx`);
}
