import { CAPITULOS, type Capitulo } from '@/data/regimento';
export type Empresa = { nome: string; cnpj: string; cidade: string; data: string; representante: string };
export type Params = { tolerancia_min: number; interjornada_h: number; prazo_h: number; susp_min: number; susp_max: number };
export type Estado = { empresa: Empresa; params: Params; marcados: Record<string, boolean> };
export type Parte = { text: string; token: boolean };
export const PARAMS_PADRAO: Params = { tolerancia_min: 10, interjornada_h: 11, prazo_h: 48, susp_min: 1, susp_max: 5 };
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
export const dataExtenso = (d = new Date()) => `${String(d.getDate()).padStart(2, '0')} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
export const estadoPadrao = (): Estado => ({
  empresa: { nome: 'EMPRESA EXEMPLO LTDA', cnpj: '00.000.000/0001-00', cidade: 'Itajobi', data: dataExtenso(), representante: 'Nome do representante' },
  params: { ...PARAMS_PADRAO },
  marcados: Object.fromEntries(CAPITULOS.flatMap(c => c.artigos.map(a => [a.id, true]))),
});
export const TOTAL_ARTIGOS = CAPITULOS.reduce((n, c) => n + c.artigos.length, 0);
export function valorToken(nome: string, p: Params): string {
  switch (nome) {
    case 'tolerancia_min': return `${p.tolerancia_min} minutos`;
    case 'interjornada_h': return `${p.interjornada_h} horas`;
    case 'prazo_h': return `${p.prazo_h} horas`;
    case 'suspensao': return `${p.susp_min} a ${p.susp_max} dias`;
    default: return `{{${nome}}}`;
  }
}
const semHtml = (s: string) => s.replace(/<[^>]*>/g, '');
/** Divide o texto em partes, marcando o que veio dos parâmetros. */
export function partes(texto: string, p: Params): Parte[] {
  return semHtml(texto).split(/(\{\{\w+\}\})/).filter(Boolean).map(s => { const m = /^\{\{(\w+)\}\}$/.exec(s); return m ? { text: valorToken(m[1]!, p), token: true } : { text: s, token: false }; });
}
export const textoPlano = (texto: string, p: Params) => partes(texto, p).map(x => x.text).join('');
export const nomeEmpresa = (e: Empresa) => e.nome.trim() || 'EMPRESA';
export type ArtigoMontado = { id: string; numero: number; partes: Parte[] };
export type ItemResumo = { numero: number; partes: Parte[] };
export type Montado = { capitulos: { numero: number; titulo: string; artigos: ArtigoMontado[] }[]; pode: ItemResumo[]; naoPode: ItemResumo[]; total: number };
export const ordinal = (n: number) => `Art. ${n}º`;
export function montarRegimento(estado: Estado, caps: Capitulo[] = CAPITULOS): Montado {
  let n = 0; const pode: ItemResumo[] = []; const naoPode: ItemResumo[] = [];
  const capitulos = caps.map(c => ({ numero: c.numero, titulo: c.titulo, artigos: c.artigos.filter(a => estado.marcados[a.id]).map(a => {
    n += 1;
    if (a.resumo) (a.resumo.tipo === 'pode' ? pode : naoPode).push({ numero: n, partes: partes(a.resumo.texto, estado.params) });
    return { id: a.id, numero: n, partes: partes(a.texto, estado.params) };
  }) })).filter(c => c.artigos.length);
  return { capitulos, pode, naoPode, total: n };
}
export const nomeArquivo = (e: Empresa) => `regimento_interno_${nomeEmpresa(e).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}.pdf`;
export const INTRO = [
  'Com vistas a dar mais segurança aos nossos colaboradores é que confeccionamos este regimento, sendo que as questões omissas serão tratadas de acordo com o que dispõe a legislação brasileira.',
  'Para fins deste regimento, a entidade jurídica empregadora será denominada simplesmente de “EMPRESA”, ao passo que, todos os colaboradores que laboram de forma contínua, subordinada, pessoal e onerosa serão denominados simplesmente de “EMPREGADOS”.',
];
export const FECHAMENTO = 'Este regimento interno entra em vigor na data de sua divulgação, revogando-se as disposições em contrário.';
export const cidadeData = (e: Empresa) => [e.cidade.trim(), e.data.trim()].filter(Boolean).join(', ');
