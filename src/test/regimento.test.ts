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
    const e = estadoPadrao(); e.params.tolerancia_min = 15;
    expect(textoPlano('até {{tolerancia_min}} e {{suspensao}}', e.params)).toBe('até 15 minutos e 1 a 5 dias');
    expect(join(montarRegimento(e).pode[0]!.partes)).toContain('15 minutos');
  });
  it('nome do arquivo sem acentos', () => { const e = estadoPadrao(); e.empresa.nome = 'Padaria São João Ltda'; expect(nomeArquivo(e.empresa)).toBe('regimento_interno_padaria_sao_joao_ltda.pdf'); e.empresa.nome = ''; expect(nomeArquivo(e.empresa)).toBe('regimento_interno_empresa.pdf'); });
});
