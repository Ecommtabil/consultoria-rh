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
    ['Salários: aceita números ou R$ 3.500,00. Notas do consultor: Sim ou Não.'],
    ['Postos: Turno deve corresponder ao nome ou à sigla de um turno.'],
    ['Escala: 5x2, 6x1, 12x36 ou 4x2. Operação: todos, segsab ou segsex.'],
    ['Cargos: Trilha Técnica ou Gestão. Nível e tempo mínimo: números inteiros.'],
    ['Uma aba presente, mesmo sem linhas, substitui e limpa seus dados. CSV importa uma tabela.'],
  ]),'Como preencher');
  XLSX.writeFile(book,'Modelo_Kit_Governanca.xlsx');
}
export async function readSpreadsheet(file: File) {
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) throw new Error('Selecione um arquivo .xlsx, .xls ou .csv.');
  const book = XLSX.read(await file.arrayBuffer(), {type:'array',cellDates:false});
  return parseSheets(Object.fromEntries(book.SheetNames.map(name => { const sheet=book.Sheets[name]; if(!sheet)throw new Error('Aba ausente.'); return [name,XLSX.utils.sheet_to_json<unknown[]>(sheet,{header:1,defval:''})]; })));
}