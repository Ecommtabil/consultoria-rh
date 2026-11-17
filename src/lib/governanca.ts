import type { Tables } from '@/integrations/supabase/types';

export type Cliente = Tables<'clientes'>;
export const empresaFields = [
  ['nome','Razão social','text'], ['cnpj','CNPJ','text'], ['cidade_uf','Cidade / UF','text'],
  ['vigencia','Vigência','date'], ['aprovado_por','Aprovado por','text'],
  ['jornada_semanal','Jornada semanal (horas)','number'], ['dia_inicio','Primeiro dia da semana','text'],
  ['dia_fim','Último dia da semana','text'], ['hora_entrada','Horário de entrada','time'],
  ['hora_saida','Horário de saída','time'], ['intervalo','Intervalo','time'], ['sistema_ponto','Sistema de ponto','text'],
  ['canal_denuncias','Canal de denúncias','text'], ['responsavel_apuracao','Responsável pela apuração','text'],
  ['prazo_apuracao_dias','Prazo de apuração (dias)','number'], ['valor_max_brindes','Valor máximo de brindes (R$)','number'],
  ['mensagem_lideranca','Mensagem da liderança','textarea'], ['incluir_notas_consultor','Incluir notas do consultor','checkbox'],
] as const;
export const sheetSpecs = {
  Colaboradores: [['Nome','nome'],['Cargo','cargo'],['Departamento','departamento'],['Admissão','admissao'],['Posto','posto']],
  Turnos: [['Nome','nome'],['Sigla','sigla'],['Início','inicio'],['Fim','fim'],['Intervalo (min)','intervalo_min']],
  Postos: [['Posto','posto'],['Turno','turno'],['Pessoas por dia','pessoas_por_dia'],['Escala','escala'],['Operação','operacao']],
  Cargos: [['Família','familia'],['Cargo','cargo'],['Nível','nivel'],['Trilha','trilha'],['Salário base','salario_base'],['Tempo mínimo (meses)','tempo_minimo_meses'],['Requisitos','requisitos']],
} as const;
export const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[_\s]+/g,' ');
export function numberBR(value: unknown): number {
  if (typeof value === 'number') return value;
  const text = String(value ?? '').replace(/R\$|\s/g,'');
  const result = Number(text.includes(',') ? text.replace(/\./g,'').replace(',','.') : text);
  if (!Number.isFinite(result)) throw new Error(`Número inválido: ${value}`);
  return result;
}
export function excelDate(value: unknown): string | null {
  if (value === '' || value == null) return null;
  if (typeof value === 'number') return new Date(Date.UTC(1899,11,30) + Math.floor(value)*86400000).toISOString().slice(0,10);
  if (value instanceof Date) return value.toISOString().slice(0,10);
  const text = String(value).trim();
  const br = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  const result = br ? `${br[3]}-${(br[2] ?? '').padStart(2,'0')}-${(br[1] ?? '').padStart(2,'0')}` : text.slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(Date.parse(result))) throw new Error(`Data inválida: ${text}`);
  return result;
}
export function excelTime(value: unknown): string {
  if (typeof value === 'number') { const minutes = Math.round((value % 1)*1440)%1440; return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`; }
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value ?? ''));
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) throw new Error(`Hora inválida: ${value}`);
  return `${(match[1] ?? '').padStart(2,'0')}:${match[2]}`;
}
export type ImportBundle = { empresa?: Record<string, string | number | boolean | null>; colaboradores?: Record<string, unknown>[]; turnos?: Record<string, unknown>[]; postos?: Record<string, unknown>[]; cargos?: Record<string, unknown>[] };
export function parseSheets(sheets: Record<string, unknown[][]>): ImportBundle {
  const bundle: ImportBundle = {};
  for (const [sheetName, rawRows] of Object.entries(sheets)) {
    const rows = rawRows.filter(row => row.some(cell => cell !== '' && cell != null));
    const headers = (rows[0] ?? []).map(normalize);
    if (normalize(sheetName) === 'como preencher') continue;
    if (normalize(sheetName) === 'empresa' || (headers.includes('campo') && headers.includes('valor'))) {
      const fields: NonNullable<ImportBundle['empresa']> = {};
      for (const row of rows.slice(1)) {
        const field = empresaFields.find(([key,label]) => normalize(key) === normalize(row[0]) || normalize(label) === normalize(row[0]));
        if (!field || row[1] === '' || row[1] == null) continue;
        const [key,,type] = field;
        fields[key] = type === 'number' ? numberBR(row[1]) : type === 'date' ? excelDate(row[1]) : type === 'time' ? excelTime(row[1]) : type === 'checkbox' ? ['sim','true','1','verdadeiro'].includes(normalize(row[1])) : String(row[1]);
      }
      bundle.empresa = fields; continue;
    }
    const spec = Object.entries(sheetSpecs).find(([name, columns]) => normalize(name) === normalize(sheetName) || columns.every(([label]) => headers.includes(normalize(label))));
    if (!spec) throw new Error(`Aba não reconhecida: ${sheetName}. Use os cabeçalhos da planilha modelo.`);
    const [name,columns] = spec;
    if (!columns.every(([label]) => headers.includes(normalize(label)))) throw new Error(`Colunas obrigatórias ausentes em ${name}.`);
    const records = rows.slice(1).map((row, index) => {
      const record: Record<string,unknown> = {};
      for (const [label,key] of columns) {
        const value = row[headers.indexOf(normalize(label))] ?? '';
        record[key] = key === 'admissao' ? excelDate(value) : ['inicio','fim'].includes(key) ? excelTime(value) : ['intervalo_min','pessoas_por_dia','nivel','salario_base','tempo_minimo_meses'].includes(key) ? numberBR(value) : String(value).trim();
      }
      if (name === 'Postos') {
        if (!['5x2','6x1','12x36','4x2'].includes(String(record['escala']))) throw new Error(`Escala inválida na linha ${index+2}.`);
        if (!['todos','segsab','segsex'].includes(normalize(record['operacao']))) throw new Error(`Operação inválida na linha ${index+2}.`);
        record['operacao'] = normalize(record['operacao']);
      }
      if (name === 'Cargos') {
        const trail = normalize(record['trilha']);
        if (!['tecnica','gestao'].includes(trail)) throw new Error(`Trilha inválida na linha ${index+2}.`);
        record['trilha'] = trail === 'gestao' ? 'Gestão' : 'Técnica';
      }
      return record;
    });
    const key = normalize(name) as 'colaboradores'|'turnos'|'postos'|'cargos';
    if (bundle[key]) throw new Error(`Mais de uma aba para ${name}.`);
    bundle[key] = records;
  }
  if (Object.keys(bundle).length === 0) throw new Error('Nenhum dado reconhecido no arquivo.');
  return bundle;
}