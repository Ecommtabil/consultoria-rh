import { describe, it, expect } from 'vitest';
import { notaFinal, classificacao } from './avaliacao';
const cs = [{ id: 'a', nome: 'A', descricao: '', peso: 3 }, { id: 'b', nome: 'B', descricao: '', peso: 1 }];
describe('avaliação de candidato', () => {
  it('nota máxima em todos os critérios dá 100', () => expect(notaFinal(cs, { a: 5, b: 5 })).toBe(100));
  it('pondera pelos pesos', () => expect(notaFinal(cs, { a: 5, b: 0 })).toBe(75));
  it('critério sem nota conta como zero', () => expect(notaFinal(cs, { b: 5 })).toBe(25));
  it('classifica pelas faixas 75 e 50', () => {
    expect(classificacao(75).rotulo).toBe('Recomendado');
    expect(classificacao(50).rotulo).toBe('Recomendado com ressalvas');
    expect(classificacao(49).rotulo).toBe('Não recomendado');
  });
});
