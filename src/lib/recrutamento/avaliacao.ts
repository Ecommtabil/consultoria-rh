export type Criterio = { id: string; nome: string; descricao: string; peso: number };
export type AnaliseCriterio = { id: string; nota: number; justificativa: string };
export type Analise = {
  nome: string; email: string; telefone: string; resumo: string; formacao: string;
  experiencia_anos: number; cargos_anteriores: string[]; pontos_fortes: string[];
  pontos_atencao: string[]; perguntas_entrevista: string[]; criterios: AnaliseCriterio[];
  recomendacao: 'recomendado' | 'avaliar' | 'nao_recomendado';
};
export const CRITERIOS_PADRAO: Omit<Criterio, 'id'>[] = [
  { nome: 'Experiência na função', descricao: 'Tempo e relevância da experiência em funções semelhantes.', peso: 3 },
  { nome: 'Formação e cursos', descricao: 'Escolaridade, cursos e certificações ligadas à vaga.', peso: 2 },
  { nome: 'Competências técnicas', descricao: 'Domínio das ferramentas e conhecimentos exigidos.', peso: 3 },
  { nome: 'Perfil comportamental', descricao: 'Sinais de comunicação, trabalho em equipe e responsabilidade.', peso: 2 },
  { nome: 'Estabilidade profissional', descricao: 'Permanência nos empregos anteriores.', peso: 1 },
];
export const novoId = () => Math.random().toString(36).slice(2, 10);
/** Nota final 0–100: média ponderada das notas (0 a 5) pelos pesos. Critério sem nota conta como 0. */
export function notaFinal(criterios: Criterio[], notas: Record<string, number>): number {
  const pesos = criterios.reduce((s, c) => s + Math.max(0, c.peso), 0);
  if (!pesos) return 0;
  const soma = criterios.reduce((s, c) => s + Math.max(0, c.peso) * Math.min(5, Math.max(0, notas[c.id] ?? 0)), 0);
  return Math.round((soma / (pesos * 5)) * 100);
}
export function classificacao(nota: number): { rotulo: string; tom: 'ok' | 'medio' | 'baixo' } {
  if (nota >= 75) return { rotulo: 'Recomendado', tom: 'ok' };
  if (nota >= 50) return { rotulo: 'Recomendado com ressalvas', tom: 'medio' };
  return { rotulo: 'Não recomendado', tom: 'baixo' };
}
/** Notas iniciais sugeridas pela IA, mantendo as já dadas pelo consultor. */
export function notasIniciais(criterios: Criterio[], analise: Analise | null, atuais: Record<string, number>) {
  const r: Record<string, number> = {};
  for (const c of criterios) { const v = atuais[c.id] ?? analise?.criterios.find(a => a.id === c.id)?.nota; if (v !== undefined) r[c.id] = v; }
  return r;
}
