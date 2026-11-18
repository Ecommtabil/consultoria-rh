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
  Colaboradores: [['Nome','nome'],['Matrícula','matricula'],['Setor','setor'],['Departamento','departamento'],['Cargo','cargo'],['Admissão','admissao'],['Sexo (F/M)','sexo'],['Jornada (6x1/5x2)','jornada_atual'],['Horas semanais','horas_semanais'],['Entrada','entrada'],['Saída','saida'],['Sábado entrada','sab_entrada'],['Sábado saída','sab_saida'],['Domingo entrada','dom_entrada'],['Domingo saída','dom_saida'],['Salário','salario']],
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
const chave = (v: unknown) => normalize(v).replace(/[^a-z0-9]/g, '');
const ALIAS: Record<string, string[]> = {
  nome: ['nome','funcionario','colaborador','nomecompleto','empregado'], matricula: ['matricula','registro','re'], setor: ['setor'], departamento: ['departamento','area'],
  cargo: ['cargo','funcao'], admissao: ['admissao','dataadmissao','dataadmissao'], sexo: ['sexo','sexofm','genero'], jornada_atual: ['jornada','jornada6x15x2','regime','escala'],
  horas_semanais: ['horassemanais','cargahoraria','horas','cargahorariasemanal'], entrada: ['entrada','inicio','horaentrada'], saida: ['saida','fim','horasaida'],
  sab_entrada: ['sabadoentrada','sabentrada'], sab_saida: ['sabadosaida','sabsaida'], dom_entrada: ['domingoentrada','domentrada'], dom_saida: ['domingosaida','domsaida'], salario: ['salario','salariobase','remuneracao'],
};
export type LinhaAviso = { linha: number; nome: string; avisos: string[] };
function horaOuVazio(v: unknown, avisos: string[], rotulo: string): string | null {
  if (v === '' || v == null) return null; try { return excelTime(v); } catch { avisos.push(`${rotulo} inválida (“${String(v)}”)`); return null; }
}
export function parseColaboradores(rows: unknown[][]): { registros: Record<string, unknown>[]; avisos: LinhaAviso[] } {
  const headers = (rows[0] ?? []).map(chave); const col: Record<string, number> = {};
  for (const [k, al] of Object.entries(ALIAS)) { const i = headers.findIndex(h => al.includes(h)); if (i >= 0) col[k] = i; }
  if (col['nome'] === undefined) throw new Error('Coluna Nome ausente em Colaboradores.');
  const setorCol = col['setor'] ?? col['departamento'];
  const registros: Record<string, unknown>[] = []; const avisos: LinhaAviso[] = [];
  rows.slice(1).forEach((row, i) => {
    const get = (k: string) => (col[k] === undefined ? '' : row[col[k]!] ?? ''); const txt = (k: string) => String(get(k)).trim();
    const nome = txt('nome'); if (!nome) return; const av: string[] = [];
    let admissao: string | null = null; try { admissao = excelDate(get('admissao')); } catch { av.push('Admissão inválida'); }
    const sx = normalize(get('sexo')); const sexo = ['f','feminino','mulher'].includes(sx) ? 'F' : ['m','masculino','homem'].includes(sx) ? 'M' : null;
    if (!sexo) av.push(sx ? `Sexo não reconhecido (“${String(get('sexo'))}”)` : 'Sexo não informado');
    const jr = chave(get('jornada_atual')); const jornada = jr.includes('6x1') ? '6x1' : jr.includes('5x2') ? '5x2' : null; if (jr && !jornada) av.push('Jornada deve ser 6x1 ou 5x2');
    let horas: number | null = null; if (txt('horas_semanais')) { try { horas = numberBR(String(get('horas_semanais')).replace(/h.*$/i, '')); } catch { av.push('Horas semanais inválidas'); } }
    const entrada = horaOuVazio(get('entrada'), av, 'Entrada'); const saida = horaOuVazio(get('saida'), av, 'Saída');
    const dia = (p: 'sab' | 'dom', rot: string) => {
      const e = get(`${p}_entrada`); const s = get(`${p}_saida`);
      if (normalize(e) === 'folga' || normalize(s) === 'folga') return { modo: 'folga', ent: null, sai: null };
      const ent = horaOuVazio(e, av, `${rot} entrada`); const sai = horaOuVazio(s, av, `${rot} saída`);
      if (ent && sai) return { modo: 'diferente', ent, sai }; if (ent || sai) av.push(`${rot}: informe entrada e saída`); return { modo: 'igual', ent: null, sai: null };
    };
    const sab = dia('sab', 'Sábado'); const dom = dia('dom', 'Domingo');
    let salario: number | null = null; if (txt('salario')) { try { salario = numberBR(get('salario')); } catch { av.push('Salário inválido'); } }
    registros.push({ nome, matricula: txt('matricula') || null, setor: setorCol === undefined ? null : String(row[setorCol] ?? '').trim() || null, departamento: txt('departamento') || null, cargo: txt('cargo') || null, admissao, sexo, jornada_atual: jornada, horas_semanais: horas, entrada, saida, sab_modo: sab.modo, sab_entrada: sab.ent, sab_saida: sab.sai, dom_modo: dom.modo, dom_entrada: dom.ent, dom_saida: dom.sai, salario });
    if (av.length) avisos.push({ linha: i + 2, nome, avisos: av });
  });
  return { registros, avisos };
}
export type ImportBundle = { empresa?: Record<string, string | number | boolean | null>; colaboradores?: Record<string, unknown>[]; cargos?: Record<string, unknown>[]; avisosColaboradores?: LinhaAviso[] };
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
    if (['turnos','postos'].includes(normalize(sheetName))) continue;
    const keys = (rows[0] ?? []).map(chave);
    if (normalize(sheetName) === 'colaboradores' || (!(normalize(sheetName) === 'cargos') && keys.some(k => ALIAS['nome']!.includes(k)) && !keys.includes('trilha'))) {
      if (bundle.colaboradores) throw new Error('Mais de uma aba para Colaboradores.');
      const r = parseColaboradores(rows); bundle.colaboradores = r.registros; bundle.avisosColaboradores = r.avisos; continue;
    }
    const columns = sheetSpecs.Cargos;
    if (!(normalize(sheetName) === 'cargos' || columns.every(([label]) => headers.includes(normalize(label))))) {
      if (['turnos','postos'].includes(normalize(sheetName))) continue;
      throw new Error(`Aba não reconhecida: ${sheetName}. Use os cabeçalhos da planilha modelo.`);
    }
    if (!columns.every(([label]) => headers.includes(normalize(label)))) throw new Error('Colunas obrigatórias ausentes em Cargos.');
    if (bundle.cargos) throw new Error('Mais de uma aba para Cargos.');
    bundle.cargos = rows.slice(1).map((row, index) => {
      const record: Record<string,unknown> = {};
      for (const [label,key] of columns) { const value = row[headers.indexOf(normalize(label))] ?? ''; record[key] = ['nivel','salario_base','tempo_minimo_meses'].includes(key) ? numberBR(value) : String(value).trim(); }
      const trail = normalize(record['trilha']); if (!['tecnica','gestao'].includes(trail)) throw new Error(`Trilha inválida na linha ${index+2}.`);
      record['trilha'] = trail === 'gestao' ? 'Gestão' : 'Técnica'; return record;
    });
  }
  if (Object.keys(bundle).length === 0) throw new Error('Nenhum dado reconhecido no arquivo.');
  return bundle;
}