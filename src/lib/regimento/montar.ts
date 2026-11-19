import { CAPITULOS, type Artigo, type Capitulo, type Resumo } from '@/data/regimento';
export type { Resumo };
import { CAPITULOS_CODIGO } from '@/data/codigo';
export type Empresa = { nome: string; cnpj: string; cidade: string; data: string; representante: string };
export type Params = Record<string, number | string>;
export type ArtigoExtra = Artigo & { cap: number };
export type Estado = { empresa: Empresa; params: Params; marcados: Record<string, boolean>; extras: ArtigoExtra[]; capsExtras: { numero: number; titulo: string }[] };
export type Parte = { text: string; token: boolean };
export type Campo = { key: string; aria: string; tipo: 'num' | 'texto'; un?: string };
export type LinhaParam = { titulo: string; sub: string; campos: Campo[]; largo?: boolean };
export type ClienteBase = { id: string; nome?: string | null; cnpj?: string | null; cidade_uf?: string | null; aprovado_por?: string | null; canal_denuncias?: string | null; responsavel_apuracao?: string | null; valor_max_brindes?: number | null; prazo_apuracao_dias?: number | null; mensagem_lideranca?: string | null };
export type Modelo = { id: 'regimento' | 'codigo'; nomeGerador: string; tituloDoc: string; subtituloDoc: string; capitulos: Capitulo[]; linhas: LinhaParam[]; padrao: Params; doCliente: (c: ClienteBase) => Params; tokens: Record<string, (p: Params) => string>; intro: string[]; fechamento: string; arquivo: string; prefixoExtra: string };
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
export const dataExtenso = (d = new Date()) => `${String(d.getDate()).padStart(2, '0')} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
const n = (p: Params, k: string) => Number(p[k]) || 0;
const s = (p: Params, k: string, ph: string) => String(p[k] ?? '').trim() || ph;
export const REGIMENTO: Modelo = {
  id: 'regimento', nomeGerador: 'Gerador de Regimento Interno', tituloDoc: 'REGIMENTO INTERNO', subtituloDoc: 'Normas e diretrizes para colaboradores', capitulos: CAPITULOS, arquivo: 'regimento_interno', prefixoExtra: 'rx',
  linhas: [
    { titulo: 'Tolerância de ponto', sub: 'Art. 7º — entrada + saída somadas', campos: [{ key: 'tolerancia_min', aria: 'Tolerância de ponto', tipo: 'num', un: 'min' }] },
    { titulo: 'Intervalo interjornada', sub: 'Art. 9º — mínimo legal: 11h', campos: [{ key: 'interjornada_h', aria: 'Intervalo interjornada', tipo: 'num', un: 'h' }] },
    { titulo: 'Prazo para justificar falta', sub: 'Art. 10º — após o retorno', campos: [{ key: 'prazo_h', aria: 'Prazo para justificar falta', tipo: 'num', un: 'h' }] },
    { titulo: 'Suspensão disciplinar', sub: 'Art. 28º — faixa', campos: [{ key: 'susp_min', aria: 'Suspensão mínima', tipo: 'num', un: 'a' }, { key: 'susp_max', aria: 'Suspensão máxima', tipo: 'num', un: 'dias' }] },
  ],
  padrao: { tolerancia_min: 10, interjornada_h: 11, prazo_h: 48, susp_min: 1, susp_max: 5 }, doCliente: () => ({}),
  tokens: { tolerancia_min: p => `${n(p, 'tolerancia_min')} minutos`, interjornada_h: p => `${n(p, 'interjornada_h')} horas`, prazo_h: p => `${n(p, 'prazo_h')} horas`, suspensao: p => `${n(p, 'susp_min')} a ${n(p, 'susp_max')} dias` },
  intro: [
    'Com vistas a dar mais segurança aos nossos colaboradores é que confeccionamos este regimento, sendo que as questões omissas serão tratadas de acordo com o que dispõe a legislação brasileira.',
    'Para fins deste regimento, a entidade jurídica empregadora será denominada simplesmente de “EMPRESA”, ao passo que, todos os colaboradores que laboram de forma contínua, subordinada, pessoal e onerosa serão denominados simplesmente de “EMPREGADOS”.',
  ],
  fechamento: 'Este regimento interno entra em vigor na data de sua divulgação, revogando-se as disposições em contrário.',
};
export const CODIGO: Modelo = {
  id: 'codigo', nomeGerador: 'Gerador de Código de Ética', tituloDoc: 'CÓDIGO DE ÉTICA E CONDUTA', subtituloDoc: 'Princípios que orientam nossas relações e decisões', capitulos: CAPITULOS_CODIGO, arquivo: 'codigo_de_etica', prefixoExtra: 'cx',
  linhas: [
    { titulo: 'Valor máximo de brindes', sub: 'Cap. 5 — presentes e brindes', campos: [{ key: 'valor_brindes', aria: 'Valor máximo de brindes', tipo: 'num', un: 'R$' }] },
    { titulo: 'Prazo de apuração', sub: 'Cap. 8 — denúncias', campos: [{ key: 'prazo_apuracao', aria: 'Prazo de apuração', tipo: 'num', un: 'dias' }] },
    { titulo: 'Canal de denúncias', sub: 'Cap. 8 — e-mail, telefone ou link', campos: [{ key: 'canal', aria: 'Canal de denúncias', tipo: 'texto' }], largo: true },
    { titulo: 'Responsável pela apuração', sub: 'Cap. 8 — pessoa ou comitê', campos: [{ key: 'responsavel', aria: 'Responsável pela apuração', tipo: 'texto' }], largo: true },
    { titulo: 'Mensagem da liderança', sub: 'Abre o documento (opcional)', campos: [{ key: 'mensagem', aria: 'Mensagem da liderança', tipo: 'texto' }], largo: true },
  ],
  padrao: { valor_brindes: 100, prazo_apuracao: 15, canal: '', responsavel: '', mensagem: '' },
  doCliente: c => ({ ...(c.valor_max_brindes ? { valor_brindes: c.valor_max_brindes } : {}), ...(c.prazo_apuracao_dias ? { prazo_apuracao: c.prazo_apuracao_dias } : {}), ...(c.canal_denuncias?.trim() ? { canal: c.canal_denuncias.trim() } : {}), ...(c.responsavel_apuracao?.trim() ? { responsavel: c.responsavel_apuracao.trim() } : {}), ...(c.mensagem_lideranca?.trim() ? { mensagem: c.mensagem_lideranca.trim() } : {}) }),
  tokens: { valor_brindes: p => `R$ ${n(p, 'valor_brindes').toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, prazo_apuracao: p => `${n(p, 'prazo_apuracao')} dias`, canal: p => s(p, 'canal', '[CANAL DE DENÚNCIAS]'), responsavel: p => s(p, 'responsavel', '[RESPONSÁVEL PELA APURAÇÃO]'), mensagem: p => String(p['mensagem'] ?? '').trim() },
  intro: ['{{mensagem}}', 'Este Código reúne os princípios e as condutas esperadas de todos que atuam em nome da EMPRESA, orientando as relações com colegas, clientes, fornecedores e a sociedade.'],
  fechamento: 'Este Código de Ética e Conduta entra em vigor na data de sua divulgação e aplica-se a todos os colaboradores, independentemente de cargo ou função.',
};
export const MODELOS = { regimento: REGIMENTO, codigo: CODIGO };
export const totalArtigos = (m: Modelo, e?: Estado) => m.capitulos.reduce((t, c) => t + c.artigos.length, 0) + (e?.extras.length ?? 0);
export const TOTAL_ARTIGOS = totalArtigos(REGIMENTO);
export function estadoPadrao(m: Modelo = REGIMENTO, c?: ClienteBase): Estado {
  const e: Estado = { empresa: { nome: 'EMPRESA EXEMPLO LTDA', cnpj: '00.000.000/0001-00', cidade: 'Itajobi', data: dataExtenso(), representante: 'Nome do representante' }, params: { ...m.padrao }, marcados: Object.fromEntries(m.capitulos.flatMap(k => k.artigos.map(a => [a.id, true]))), extras: [], capsExtras: [] };
  if (c) {
    if (c.nome?.trim()) e.empresa.nome = c.nome.trim();
    if (c.cnpj?.trim()) e.empresa.cnpj = c.cnpj.trim();
    const cid = c.cidade_uf?.split(/[/-]/)[0]?.trim(); if (cid) e.empresa.cidade = cid;
    if (c.aprovado_por?.trim()) e.empresa.representante = c.aprovado_por.trim();
    e.params = { ...e.params, ...m.doCliente(c) };
  }
  return e;
}
const semHtml = (t: string) => t.replace(/<[^>]*>/g, '');
/** Divide o texto em partes, marcando o que veio dos parâmetros. */
export function partes(texto: string, p: Params, m: Modelo = REGIMENTO): Parte[] {
  return semHtml(texto).split(/(\{\{\w+\}\})/).filter(Boolean).map(x => { const t = /^\{\{(\w+)\}\}$/.exec(x); const f = t ? m.tokens[t[1]!] : undefined; return f ? { text: f(p), token: true } : { text: x, token: false }; }).filter(x => x.text !== '');
}
export const textoPlano = (texto: string, p: Params, m: Modelo = REGIMENTO) => partes(texto, p, m).map(x => x.text).join('');
export const nomeEmpresa = (e: Empresa) => e.nome.trim() || 'EMPRESA';
/** Capítulos do modelo mais artigos e capítulos incluídos pelo usuário. */
export function capitulosDe(m: Modelo, e: Estado): (Capitulo & { extra?: boolean })[] {
  const base = [...m.capitulos.map(c => ({ ...c })), ...e.capsExtras.map(c => ({ ...c, artigos: [] as Artigo[], extra: true }))];
  return base.map(c => ({ ...c, artigos: [...c.artigos, ...e.extras.filter(a => a.cap === c.numero)] }));
}
export type ArtigoMontado = { id: string; numero: number; partes: Parte[] };
export type ItemResumo = { numero: number; partes: Parte[] };
export type Montado = { capitulos: { numero: number; titulo: string; artigos: ArtigoMontado[] }[]; pode: ItemResumo[]; naoPode: ItemResumo[]; total: number; intro: Parte[][] };
export const ordinal = (k: number) => `Art. ${k}º`;
export function montarRegimento(estado: Estado, m: Modelo = REGIMENTO): Montado {
  let k = 0; const pode: ItemResumo[] = []; const naoPode: ItemResumo[] = [];
  const capitulos = capitulosDe(m, estado).map(c => ({ numero: c.numero, titulo: c.titulo, artigos: c.artigos.filter(a => estado.marcados[a.id]).map(a => {
    k += 1;
    if (a.resumo?.texto.trim()) (a.resumo.tipo === 'pode' ? pode : naoPode).push({ numero: k, partes: partes(a.resumo.texto, estado.params, m) });
    return { id: a.id, numero: k, partes: partes(a.texto, estado.params, m) };
  }) })).filter(c => c.artigos.length);
  const intro = m.intro.map(t => partes(t, estado.params, m)).filter(p => p.length);
  return { capitulos, pode, naoPode, total: k, intro };
}
export const nomeArquivo = (e: Empresa, m: Modelo = REGIMENTO) => `${m.arquivo}_${nomeEmpresa(e).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}.pdf`;
export const cidadeData = (e: Empresa) => [e.cidade.trim(), e.data.trim()].filter(Boolean).join(', ');
