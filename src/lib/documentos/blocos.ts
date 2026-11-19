import type { Tables } from '@/integrations/supabase/types';
import { amplitude, letras, pctBR, porFamilia, steps as calcSteps, type CargoLinha } from '@/lib/cargos/calc';
/** Estrutura única de blocos: usada pela pré-visualização, pelo Word e pelo PDF. */
export type Bloco =
  | { t: 'title' | 'h1' | 'h2' | 'p' | 'li' | 'note'; text: string }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'fields'; items: [string, string][] }
  | { t: 'sign'; label: string }
  | { t: 'break' };
export type DocId = 'regimento' | 'codigo' | 'termo' | 'plano';
export type Capa = { empresa: string; titulo: string; subtitulo: string; versao: string; aprovado: string };
export type Tema = { cor: string; fonte: 'serif' | 'sans' };
export type Documento = { id: DocId; titulo: string; cabecalho: string; capa: Capa | null; blocos: Bloco[]; arquivo: string; tema?: Tema };
type Cliente = Partial<Tables<'clientes'>>;
type Sancao = Pick<Tables<'sancoes'>, 'situacao' | 'medida' | 'recorrencia'>;
type Colab = Pick<Tables<'colaboradores'>, 'nome' | 'cargo' | 'departamento' | 'admissao'>;
export type Entrada = { cliente: Cliente; sancoes: Sancao[]; colaboradores: Colab[]; termoModo: 'branco' | 'equipe'; cargos?: CargoLinha[]; steps?: number; pct?: number };

const A = '⟦', B = '⟧';
export const ph = (label: string) => `${A}${label}${B}`;
/** Texto final para Word/PDF: placeholders viram [CAMPO]. */
export const plano = (s: string) => s.replaceAll(A, '[').replaceAll(B, ']');
export function segmentos(s: string): { text: string; ph: boolean }[] {
  return s.split(/(⟦[^⟧]*⟧)/).filter(Boolean).map(p => p.startsWith(A) ? { text: `[${p.slice(1, -1)}]`, ph: true } : { text: p, ph: false });
}
const val = (v: unknown, label: string) => { const s = v == null ? '' : String(v).trim(); return s ? s : ph(label); };
const num = (v: number | null | undefined, label: string) => (v == null || v === 0 ? ph(label) : String(v).replace('.', ','));
export const dataBR = (iso?: string | null) => { if (!iso) return ''; const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
const dinheiro = (v?: number | null) => (v ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ph('VALOR'));
export const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');

export const PENDENCIAS: [keyof Tables<'clientes'>, string][] = [
  ['nome', 'Nome da empresa'], ['cidade_uf', 'Cidade / UF'], ['vigencia', 'Vigência'], ['aprovado_por', 'Aprovado por'],
  ['jornada_semanal', 'Jornada semanal'], ['hora_entrada', 'Horário de entrada'], ['hora_saida', 'Horário de saída'],
  ['sistema_ponto', 'Sistema de ponto'], ['canal_denuncias', 'Canal de denúncias'], ['valor_max_brindes', 'Valor máximo de brindes'],
  ['mensagem_lideranca', 'Mensagem da liderança'],
];
export const preenchido = (v: unknown) => (typeof v === 'number' ? v > 0 : v != null && String(v).trim() !== '');

export const NOMES: Record<DocId, string> = { regimento: 'Regimento Interno', codigo: 'Código de Ética e Conduta', termo: 'Termo de Ciência', plano: 'Plano de Cargos, Salários e Carreira' };
export const pendenciasDe = (id: DocId) => (id === 'plano' ? PENDENCIAS.filter(([k]) => ['nome', 'cidade_uf', 'vigencia', 'aprovado_por'].includes(k)) : PENDENCIAS);
const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function montar(id: DocId, e: Entrada): Documento {
  const c = e.cliente; const emp = val(c.nome, 'NOME DA EMPRESA'); const titulo = NOMES[id];
  const notas = c.incluir_notas_consultor !== false;
  const capa = (subtitulo: string): Capa => ({ empresa: emp, titulo, subtitulo, versao: `Versão 1.0 • Vigência a partir de ${c.vigencia ? dataBR(c.vigencia) : ph('DD/MM/AAAA')}`, aprovado: `Documento aprovado por: ${val(c.aprovado_por, 'NOME DO APROVADOR')}` });
  let blocos: Bloco[] = []; let cp: Capa | null = null;
  if (id === 'regimento') {
    cp = capa('Normas e diretrizes de convivência e organização do trabalho');
    const sanc = e.sancoes.length ? e.sancoes.map(s => [val(s.situacao, 'SITUAÇÃO'), val(s.medida, 'MEDIDA'), val(s.recorrencia, 'RECORRÊNCIA')]) : [[ph('SITUAÇÃO'), ph('MEDIDA'), ph('RECORRÊNCIA')]];
    blocos = [
      { t: 'h1', text: 'Capítulo 1 — Disposições Gerais' },
      { t: 'p', text: `Este Regimento Interno estabelece as normas de conduta, organização e disciplina aplicáveis a todos os colaboradores de ${emp}, independentemente de cargo, função ou forma de contratação.` },
      { t: 'p', text: 'O desconhecimento das normas aqui previstas não exime o colaborador de seu cumprimento.' },
      { t: 'h1', text: 'Capítulo 2 — Jornada de Trabalho' },
      { t: 'h2', text: '2.1 Horário de trabalho' },
      { t: 'p', text: `A jornada de trabalho é de ${num(c.jornada_semanal, 'XX')} horas semanais, distribuídas de ${val(c.dia_inicio, 'DIA INICIAL')} a ${val(c.dia_fim, 'DIA FINAL')}, das ${val(c.hora_entrada, 'HH:MM')} às ${val(c.hora_saida, 'HH:MM')}, com intervalo de ${val(c.intervalo, 'HH:MM')} para repouso e alimentação.` },
      { t: 'p', text: 'Funções que exijam escalas especiais, como 12x36, 6x1 ou turnos de revezamento, terão seus horários definidos em escala própria, respeitadas a legislação e as convenções coletivas aplicáveis.' },
      { t: 'h2', text: '2.2 Registro de ponto' },
      { t: 'p', text: `O registro da jornada é obrigatório e pessoal, realizado por meio de ${val(c.sistema_ponto, 'SISTEMA DE PONTO')}, na entrada, na saída e nos intervalos. É proibido registrar o ponto de outro colaborador.` },
      { t: 'h2', text: '2.3 Horas extras e banco de horas' },
      { t: 'p', text: 'Horas extras somente poderão ser realizadas com autorização prévia da liderança imediata. Havendo banco de horas, a compensação seguirá o acordo vigente e a legislação aplicável.' },
      { t: 'h1', text: 'Capítulo 3 — Uso de Equipamentos e Recursos' },
      { t: 'li', text: 'O e-mail corporativo e os sistemas da empresa devem ser utilizados apenas para fins profissionais.' },
      { t: 'li', text: 'É proibida a instalação de softwares não autorizados nos equipamentos da empresa.' },
      { t: 'li', text: 'O colaborador deve zelar pela conservação dos equipamentos sob sua responsabilidade, comunicando qualquer defeito ou dano.' },
      { t: 'note', text: 'Nota do consultor: adapte esta seção aos recursos efetivamente disponibilizados pelo cliente (veículos, celulares corporativos, ferramentas, uniformes e sistemas).' },
      { t: 'h1', text: 'Capítulo 4 — Trabalho Remoto / Home Office' },
      { t: 'p', text: 'O trabalho remoto, quando autorizado, será formalizado por escrito, com a definição das atividades, dos horários de disponibilidade e da responsabilidade pelos equipamentos e despesas.' },
      { t: 'p', text: 'Aplicam-se ao trabalho remoto as mesmas normas de conduta, confidencialidade e segurança da informação previstas neste Regimento.' },
      { t: 'h1', text: 'Capítulo 5 — Conduta e Convivência' },
      { t: 'p', text: 'São deveres de todos os colaboradores:' },
      { t: 'li', text: 'Tratar colegas, lideranças, clientes e fornecedores com respeito e cordialidade.' },
      { t: 'li', text: 'Cumprir os horários estabelecidos, comunicando com antecedência atrasos e ausências.' },
      { t: 'li', text: 'Utilizar uniforme e crachá, quando exigidos, mantendo boa apresentação pessoal.' },
      { t: 'li', text: 'Abster-se de qualquer forma de assédio moral ou sexual, discriminação ou violência.' },
      { t: 'h1', text: 'Capítulo 6 — Segurança e Saúde no Trabalho' },
      { t: 'p', text: 'É obrigatório o uso dos Equipamentos de Proteção Individual (EPIs) fornecidos pela empresa, bem como o cumprimento das normas de segurança e a participação nos treinamentos. A recusa injustificada ao uso de EPIs constitui falta passível de medida disciplinar.' },
      { t: 'h1', text: 'Capítulo 7 — Medidas Disciplinares' },
      { t: 'p', text: 'O descumprimento deste Regimento sujeitará o colaborador às medidas abaixo, aplicadas de forma proporcional à gravidade da falta e ao histórico funcional:' },
      { t: 'table', head: ['Situação', 'Medida', 'Recorrência'], rows: sanc },
      { t: 'note', text: 'Nota do consultor: recomenda-se a revisão desta matriz de sanções por advogado trabalhista antes da implantação.' },
      { t: 'h1', text: 'Capítulo 8 — Disposições Finais' },
      { t: 'p', text: 'Este Regimento será revisado periodicamente e sempre que houver alteração legal ou organizacional relevante.' },
      { t: 'p', text: 'A ciência de cada colaborador será formalizada por meio da assinatura do Termo de Ciência.' },
    ];
  } else if (id === 'codigo') {
    cp = capa('Princípios que orientam nossas relações e decisões');
    const msg = String(c.mensagem_lideranca ?? '').trim();
    blocos = [
      { t: 'h1', text: 'Mensagem da Liderança' },
      ...(msg ? msg.split(/\n+/).map(text => ({ t: 'p' as const, text })) : [{ t: 'p' as const, text: ph('MENSAGEM DA LIDERANÇA') }]),
      { t: 'h1', text: '1. Nossos Valores' },
      { t: 'li', text: 'Integridade: agir com honestidade e coerência em todas as situações.' },
      { t: 'li', text: 'Respeito à diversidade: valorizar as diferenças e garantir tratamento igualitário.' },
      { t: 'li', text: 'Transparência: comunicar de forma clara, verdadeira e oportuna.' },
      { t: 'li', text: 'Responsabilidade: assumir compromissos e responder pelas próprias decisões.' },
      { t: 'h1', text: '2. Relações entre Colaboradores' },
      { t: 'p', text: `Em ${emp}, as relações de trabalho devem ser pautadas pelo respeito mútuo. São expressamente proibidos:` },
      { t: 'li', text: 'Assédio moral: condutas abusivas e repetitivas que humilhem, constranjam ou desqualifiquem.' },
      { t: 'li', text: 'Assédio sexual: qualquer conduta de conotação sexual não desejada.' },
      { t: 'li', text: 'Discriminação por raça, gênero, orientação sexual, religião, idade, deficiência ou qualquer outra condição.' },
      { t: 'li', text: 'Nepotismo: favorecimento de parentes em contratações, promoções ou subordinação direta.' },
      { t: 'h1', text: '3. Clientes e Fornecedores' },
      { t: 'p', text: 'Clientes devem ser atendidos com cortesia, qualidade e honestidade. Fornecedores serão selecionados por critérios técnicos e comerciais objetivos, sem favorecimentos.' },
      { t: 'h1', text: '4. Conflito de Interesses' },
      { t: 'p', text: 'Há conflito de interesses quando interesses pessoais do colaborador possam influenciar, ou parecer influenciar, suas decisões profissionais. Exemplos:' },
      { t: 'li', text: 'Participar de negociação com empresa da qual o colaborador ou parente seja sócio.' },
      { t: 'li', text: 'Exercer atividade paralela concorrente com os negócios da empresa.' },
      { t: 'li', text: 'Utilizar informações internas para obter vantagem pessoal.' },
      { t: 'p', text: 'Situações de possível conflito devem ser comunicadas à liderança imediatamente.' },
      { t: 'h1', text: '5. Presentes e Brindes' },
      { t: 'p', text: `É permitido aceitar brindes institucionais de valor até R$ ${dinheiro(c.valor_max_brindes)}. Presentes acima desse valor, dinheiro ou vantagens de qualquer natureza devem ser recusados ou comunicados à liderança.` },
      { t: 'h1', text: '6. Informações Confidenciais' },
      { t: 'p', text: 'Informações estratégicas, financeiras e dados pessoais de colaboradores, clientes e fornecedores devem ser protegidos, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei 13.709/2018). O dever de sigilo permanece após o desligamento.' },
      { t: 'h1', text: '7. Combate à Corrupção' },
      { t: 'p', text: 'É proibido oferecer, prometer ou receber qualquer vantagem indevida de agentes públicos ou privados, nos termos da Lei Anticorrupção (Lei 12.846/2013).' },
      { t: 'h1', text: '8. Canal de Ética e Denúncias' },
      { t: 'p', text: `Violações a este Código devem ser relatadas pelo canal ${val(c.canal_denuncias, 'CANAL DE DENÚNCIAS')}. As denúncias são tratadas com sigilo, e é garantida a não retaliação a quem relatar de boa-fé.` },
      { t: 'p', text: `A apuração será conduzida por ${val(c.responsavel_apuracao, 'RESPONSÁVEL PELA APURAÇÃO')} em até ${num(c.prazo_apuracao_dias, 'XX')} dias.` },
      { t: 'h1', text: '9. Consequências do Descumprimento' },
      { t: 'p', text: 'O descumprimento deste Código sujeita o colaborador às medidas disciplinares previstas no Regimento Interno, sem prejuízo das sanções legais cabíveis.' },
      { t: 'h1', text: '10. Compromisso' },
      { t: 'p', text: 'Cada colaborador se compromete a conhecer, cumprir e promover os princípios deste Código, formalizando sua ciência por meio do Termo de Ciência.' },
      { t: 'note', text: 'Nota do consultor: ajuste os exemplos e o valor de brindes à realidade do setor do cliente.' },
    ];
  } else if (id === 'termo') {
    const pagina = (p: Colab | null): Bloco[] => [
      { t: 'title', text: 'Termo de Ciência e Compromisso' },
      { t: 'p', text: `Declaro que recebi, li e compreendi o Regimento Interno e o Código de Ética e Conduta de ${emp}, comprometendo-me a cumpri-los integralmente.` },
      { t: 'p', text: 'Declaro estar ciente de que o descumprimento das normas poderá resultar na aplicação das medidas disciplinares previstas no Regimento Interno.' },
      { t: 'p', text: `Declaro também ter conhecimento do canal de ética e denúncias (${val(c.canal_denuncias, 'CANAL DE DENÚNCIAS')}), do sigilo e da garantia de não retaliação.` },
      { t: 'fields', items: [['Nome completo', p?.nome ?? ''], ['Cargo/Função', p?.cargo ?? ''], ['Departamento', p?.departamento ?? ''], ['Data de admissão', dataBR(p?.admissao)]] },
      { t: 'p', text: `${val(String(c.cidade_uf ?? '').split(/[/-]/)[0], 'CIDADE')}, ${ph('DD')} de ${ph('mês')} de ${ph('AAAA')}.` },
      { t: 'sign', label: 'Assinatura do(a) Colaborador(a)' },
    ];
    const pessoas = e.termoModo === 'equipe' ? e.colaboradores.filter(p => p.nome?.trim()) : [];
    blocos = pessoas.length ? pessoas.flatMap((p, i) => (i ? [{ t: 'break' } as Bloco, ...pagina(p)] : pagina(p))) : pagina(null);
  } else if (id === 'plano') {
    cp = capa('Estrutura de cargos, faixas salariais e trilhas de crescimento');
    const n = e.steps ?? 5, pct = e.pct ?? 4, ls = letras(n), grupos = porFamilia(e.cargos ?? []);
    const pctTxt = `${String(pct).replace('.', ',')}%`;
    blocos = [
      { t: 'h1', text: '1. Objetivo' },
      { t: 'p', text: `Este Plano estabelece a estrutura de cargos, as faixas salariais e os critérios de progressão de ${emp}, com a finalidade de garantir equidade interna, transparência e perspectiva de crescimento profissional aos colaboradores.` },
      { t: 'h1', text: '2. Estrutura' },
      { t: 'p', text: `Os cargos estão organizados em famílias e níveis. Cada cargo possui uma faixa salarial com ${n} steps (${ls.join(', ')}), com diferença de ${pctTxt} entre steps, resultando em amplitude de ${pctBR(amplitude(n, pct))} entre o primeiro e o último step.` },
      { t: 'li', text: 'Trilha técnica: crescimento por especialização e domínio técnico, sem gestão de pessoas.' },
      { t: 'li', text: 'Trilha de gestão: liderança de equipes e responsabilidade por resultados.' },
      { t: 'h1', text: '3. Tabela salarial' },
      ...(grupos.length ? grupos.flatMap(g => [{ t: 'h2', text: g.familia } as Bloco, { t: 'table', head: ['Cargo', 'Nível', ...ls], rows: g.cargos.map(c => [`${c.cargo ?? ''}${c.trilha === 'Gestão' ? ' (gestão)' : ''}`, String(c.nivel ?? ''), ...calcSteps(c.salario_base ?? 0, n, pct).map(moeda)]) } as Bloco]) : [{ t: 'p', text: ph('CADASTRE OS CARGOS EM CARGOS E SALÁRIOS') } as Bloco]),
      { t: 'h1', text: '4. Progressão horizontal (mérito)' },
      { t: 'p', text: 'A progressão horizontal corresponde à passagem de um step para o seguinte dentro da faixa do mesmo cargo, observados cumulativamente os seguintes critérios:' },
      { t: 'li', text: 'interstício mínimo de 12 meses desde a última progressão ou admissão;' },
      { t: 'li', text: 'avaliação de desempenho satisfatória no período;' },
      { t: 'li', text: 'ausência de medida disciplinar grave nos últimos 12 meses;' },
      { t: 'li', text: 'disponibilidade orçamentária da empresa.' },
      { t: 'h1', text: '5. Promoção vertical' },
      { t: 'p', text: 'A promoção vertical corresponde à mudança para cargo de nível superior, condicionada à existência de vaga e ao atendimento dos requisitos do cargo. O colaborador promovido será enquadrado no primeiro step da nova faixa que represente aumento em relação ao salário atual.' },
      ...grupos.flatMap(g => [{ t: 'h2', text: g.familia } as Bloco, { t: 'table', head: ['Cargo', 'Trilha', 'Tempo mínimo', 'Requisitos'], rows: g.cargos.map(c => [c.cargo ?? '', c.trilha ?? 'Técnica', c.tempo_minimo_meses ? `${c.tempo_minimo_meses} meses` : '—', c.requisitos?.trim() || '—']) } as Bloco]),
      { t: 'h1', text: '6. Disposições gerais' },
      { t: 'p', text: 'Este Plano será revisado anualmente, considerando a convenção coletiva da categoria, pesquisas salariais de mercado e a saúde financeira da empresa.' },
      { t: 'p', text: 'Os casos omissos serão decididos pela diretoria em conjunto com a área de Recursos Humanos.' },
      { t: 'note', text: 'Nota do consultor: nos termos do art. 461, §§ 2º e 3º, da CLT, o plano de cargos e salários pode ser adotado por norma interna da empresa ou por negociação coletiva, dispensada a homologação ou o registro em órgão público, e as promoções podem seguir critérios de merecimento e/ou antiguidade. Recomenda-se a validação jurídica do documento e a conferência dos pisos salariais da convenção coletiva aplicável.' },
    ];
  }
  if (!notas) blocos = blocos.filter(b => b.t !== 'note');
  const arquivo = id === 'plano' ? `Plano_de_Cargos_e_Salarios_${semAcento(plano(emp))}` : `${semAcento(titulo)}_${semAcento(plano(emp))}`;
  return { id, titulo, cabecalho: plano(`${emp} — ${titulo}`), capa: cp, blocos, arquivo, ...(id === 'plano' ? { tema: { cor: '1E3A8A', fonte: 'sans' as const } } : {}) };
}
