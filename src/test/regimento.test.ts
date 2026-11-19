import { describe, expect, it } from 'vitest';
import { estadoPadrao, montarRegimento, nomeArquivo, textoPlano, TOTAL_ARTIGOS } from '@/lib/regimento/montar';
const join = (p: { text: string }[]) => p.map(x => x.text).join('');
describe('gerador de regimento', () => {
  it('começa com 36 artigos, 9 capítulos', () => { const m = montarRegimento(estadoPadrao()); expect(TOTAL_ARTIGOS).toBe(36); expect(m.total).toBe(36); expect(m.capitulos).toHaveLength(9); });
  it('renumera só os marcados e some capítulo vazio mantendo número original', () => {
    const e = estadoPadrao(); for (const id of ['a1', 'a2', 'a3', 'a4', 'a5']) e.marcados[id] = false;
    const m = montarRegimento(e);
    expect(m.capitulos[0]!.numero).toBe(2);
    expect(m.capitulos[0]!.artigos[0]).toMatchObject({ id: 'a6', numero: 1 });
    expect(m.pode[0]!.numero).toBe(2); // a7 vira Art. 2º
  });
  it('substitui tokens pelos parâmetros', () => {
    const e = estadoPadrao(); e.params['tolerancia_min'] = 15;
    expect(textoPlano('até {{tolerancia_min}} e {{suspensao}}', e.params)).toBe('até 15 minutos e 1 a 5 dias');
    expect(join(montarRegimento(e).pode[0]!.partes)).toContain('15 minutos');
  });
  it('nome do arquivo sem acentos', () => { const e = estadoPadrao(); e.empresa.nome = 'Padaria São João Ltda'; expect(nomeArquivo(e.empresa)).toBe('regimento_interno_padaria_sao_joao_ltda.pdf'); e.empresa.nome = ''; expect(nomeArquivo(e.empresa)).toBe('regimento_interno_empresa.pdf'); });
});
import { CODIGO } from '@/lib/regimento/montar';
describe('gerador de código de ética', () => {
  it('usa dados do cliente nos parâmetros', () => {
    const e = estadoPadrao(CODIGO, { id: 'x', nome: 'Padaria', canal_denuncias: 'etica@padaria.com', valor_max_brindes: 150 });
    const t = montarRegimento(e, CODIGO).capitulos.flatMap(c => c.artigos).map(a => join(a.partes)).join(' ');
    expect(t).toContain('até R$ 150,00'); expect(t).toContain('canal de ética: etica@padaria.com');
    expect(nomeArquivo(e.empresa, CODIGO)).toBe('codigo_de_etica_padaria.pdf');
  });
  it('artigo incluído entra no capítulo, numerado na sequência, e no resumo', () => {
    const e = estadoPadrao(CODIGO); e.extras.push({ id: 'n1', cap: 1, texto: 'Novo valor.', resumo: { tipo: 'pode', texto: 'Pode X.' } }); e.marcados['n1'] = true;
    const m = montarRegimento(e, CODIGO);
    expect(m.capitulos[0]!.artigos.map(a => a.numero)).toEqual([1, 2, 3, 4, 5]);
    expect(m.capitulos[1]!.artigos[0]!.numero).toBe(6);
    expect(m.pode[0]).toMatchObject({ numero: 5 });
  });
  it('capítulo incluído recebe o próximo número', () => {
    const e = estadoPadrao(CODIGO); e.capsExtras.push({ numero: 11, titulo: 'REDES SOCIAIS' }); e.extras.push({ id: 'n2', cap: 11, texto: 'Regra.' }); e.marcados['n2'] = true;
    const m = montarRegimento(e, CODIGO); expect(m.capitulos.at(-1)).toMatchObject({ numero: 11, titulo: 'REDES SOCIAIS' }); expect(m.total).toBe(23);
  });
  it('mensagem da liderança vazia não gera parágrafo', () => { expect(montarRegimento(estadoPadrao(CODIGO), CODIGO).intro).toHaveLength(1); });
});
