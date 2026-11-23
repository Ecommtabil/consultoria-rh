import { novoPdf, secao, paragrafo, cartoes, tabela, assinaturas, finalizar } from '@/lib/pdf';
import { notaFinal, classificacao, type Analise, type Criterio } from './avaliacao';
type Cand = { nome: string; email: string; telefone: string; parecer: string; notas: Record<string, number>; analise: Analise | null };
export function gerarLaudo(empresa: { nome: string; cnpj?: string | null }, vaga: { titulo: string } | null, criterios: Criterio[], c: Cand) {
  const nota = notaFinal(criterios, c.notas); const cl = classificacao(nota); const a = c.analise;
  const p = novoPdf('Laudo de Avaliação de Candidato', empresa, [`Vaga: ${vaga?.titulo ?? 'Sem vaga'} · Emitido em ${new Date().toLocaleDateString('pt-BR')}`]);
  secao(p, 'Candidato');
  paragrafo(p, `${c.nome || 'Não informado'}${c.email ? ` · ${c.email}` : ''}${c.telefone ? ` · ${c.telefone}` : ''}`);
  cartoes(p, [['Nota final', `${nota}/100`], ['Resultado', cl.rotulo], ['Experiência', a ? `${a.experiencia_anos} anos` : '—']]);
  if (a) {
    secao(p, 'Resumo do perfil'); paragrafo(p, a.resumo);
    if (a.formacao) { secao(p, 'Formação'); paragrafo(p, a.formacao); }
    if (a.cargos_anteriores.length) { secao(p, 'Experiências anteriores'); paragrafo(p, a.cargos_anteriores.map(x => `• ${x}`).join('\n')); }
  }
  if (criterios.length) {
    secao(p, 'Método de avaliação');
    tabela(p, { head: [['Critério', 'Peso', 'Nota (0–5)', 'Justificativa']], columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 14, halign: 'center' }, 2: { cellWidth: 20, halign: 'center' } },
      body: criterios.map(k => [k.nome, String(k.peso), String(c.notas[k.id] ?? '—'), a?.criterios.find(x => x.id === k.id)?.justificativa ?? '']) });
  }
  if (a) {
    if (a.pontos_fortes.length) { secao(p, 'Pontos fortes'); paragrafo(p, a.pontos_fortes.map(x => `• ${x}`).join('\n')); }
    if (a.pontos_atencao.length) { secao(p, 'Pontos de atenção'); paragrafo(p, a.pontos_atencao.map(x => `• ${x}`).join('\n')); }
  }
  secao(p, 'Parecer do avaliador'); paragrafo(p, c.parecer || 'Sem parecer registrado.');
  paragrafo(p, 'Este laudo apoia a decisão de contratação e não substitui a entrevista. A análise considera somente informações profissionais do currículo.', 8);
  assinaturas(p, ['Avaliador responsável']);
  finalizar(p, `Laudo_${(c.nome || 'candidato').replace(/\s+/g, '_')}.pdf`);
}
