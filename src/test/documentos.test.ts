import { describe, expect, it } from 'vitest';
import { montar, plano } from '@/lib/documentos/blocos';
const base = { sancoes: [], colaboradores: [{ nome: 'Ana Souza', cargo: 'Caixa', departamento: 'Loja', admissao: '2024-03-05' }, { nome: 'Bruno', cargo: null, departamento: null, admissao: null }], termoModo: 'branco' as const };
const texto = (d: ReturnType<typeof montar>) => d.blocos.map(b => ('text' in b ? plano(b.text) : '')).join('\n');
describe('documentos', () => {
  it('campo vazio vira placeholder no texto', () => {
    const d = montar('regimento', { ...base, cliente: { nome: '', sistema_ponto: '' } });
    expect(texto(d)).toContain('colaboradores de [NOME DA EMPRESA]');
    expect(texto(d)).toContain('por meio de [SISTEMA DE PONTO]');
    expect(plano(d.capa!.versao)).toBe('Versão 1.0 • Vigência a partir de [DD/MM/AAAA]');
  });
  it('preenche dados da empresa', () => {
    const d = montar('codigo', { ...base, cliente: { nome: 'Padaria São João', valor_max_brindes: 150 } });
    expect(texto(d)).toContain('até R$ 150,00');
    expect(d.arquivo).toBe('Codigo_de_Etica_e_Conduta_Padaria_Sao_Joao');
  });
  it('notas do consultor só aparecem com a opção marcada', () => {
    expect(montar('regimento', { ...base, cliente: { incluir_notas_consultor: false } }).blocos.some(b => b.t === 'note')).toBe(false);
    expect(montar('regimento', { ...base, cliente: { incluir_notas_consultor: true } }).blocos.some(b => b.t === 'note')).toBe(true);
  });
  it('termo: uma página por colaborador, sem capa', () => {
    const d = montar('termo', { ...base, termoModo: 'equipe', cliente: {} });
    expect(d.capa).toBeNull();
    expect(d.blocos.filter(b => b.t === 'break')).toHaveLength(1);
    expect(d.blocos.find(b => b.t === 'fields')).toEqual({ t: 'fields', items: [['Nome completo', 'Ana Souza'], ['Cargo/Função', 'Caixa'], ['Departamento', 'Loja'], ['Data de admissão', '05/03/2024']] });
  });
});
