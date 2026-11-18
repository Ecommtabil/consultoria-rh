import { calcAlmocos, falhasEscala, gerarEscala, setorDe, viabilidadeCarga, setorCfg, regimeSetor, fmt, fmtH, turnosPorDia, turnoRelogio, type Dimensionamento, type EscalaConfig, type FalhaSetor, type Colab, type FeriasReg } from '@/lib/escala';
export type LinhaHE = { setor: string; horas: number; valorHora: number; custoHE: number; custoContratar: number; inviavel: boolean; porPessoaDia: number };
export type Analise = { dims: Dimensionamento[]; equipe: number; necessario: number; contratacoes: number; custo: number; sem: FalhaSetor[]; com: FalhaSetor[]; he: LinhaHE[]; conclusao: string[]; horasDescobertas: number; contagem: { setor: string; necessarias: string; disponiveis: string; falha: boolean[] }[] };
export function analisar(cfg: EscalaConfig, colabs: Colab[], ferias: FeriasReg[], dims: Record<string, Dimensionamento>, mes: string): Analise {
  const lista = Object.values(dims); const enc = 1 + cfg.nova.encargos / 100;
  const e0 = gerarEscala({ cfg, colabs, ferias, mes, cenario: 'nova', contratar: false, dims }); const e1 = gerarEscala({ cfg, colabs, ferias, mes, cenario: 'nova', contratar: true, dims });
  const sem = falhasEscala(e0, calcAlmocos(e0)); const com = falhasEscala(e1, calcAlmocos(e1));
  const he = lista.map(d => { const f = sem.find(x => x.setor === d.setor); const horas = f?.pessoaHora ?? 0; const valorHora = d.salarioMedio / ((d.horas || 44) * 5);
    const porPessoaDia = d.equipe && f?.diasAnalisados ? horas / (f.diasAnalisados * d.equipe) : 0;
    return { setor: d.setor, horas, valorHora, custoHE: horas * valorHora * 1.5 * enc, custoContratar: d.custo, inviavel: porPessoaDia > 2, porPessoaDia }; });
  const contagem = lista.map(d => { const disp = d.necessidade.map((_, t) => d.alocacao.filter(a => !a.contratacao && a.turno === t).reduce((s, a) => s + a.contrib, 0));
    return { setor: d.setor, necessarias: d.necessidade.join(' + '), disponiveis: disp.join(' + '), falha: d.necessidade.map((n, t) => disp[t]! < n) }; });
  const equipe = lista.reduce((s, d) => s + d.equipe, 0); const necessario = lista.reduce((s, d) => s + d.necessario, 0);
  const contratacoes = lista.reduce((s, d) => s + d.contratacoes, 0); const custo = lista.reduce((s, d) => s + d.custo, 0); const horasDescobertas = sem.reduce((s, f) => s + f.pessoaHora, 0);
  const conclusao: string[] = [];
  conclusao.push(`Na ${cfg.nova.tipo} de ${cfg.nova.horas}h, mantendo o horário de funcionamento, a empresa precisa de ${necessario} pessoas para os postos atuais; hoje tem ${equipe}.`);
  conclusao.push(contratacoes ? `São necessárias ${contratacoes} contratação${contratacoes > 1 ? 'ões' : ''}, com custo mensal estimado de ${custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (encargos de ${cfg.nova.encargos}%).` : 'A equipe atual cobre a nova jornada sem contratações.');
  if (horasDescobertas > 0) conclusao.push(`Sem contratar, ficariam ${fmtH(horasDescobertas * 60)} descobertas no mês${sem.filter(f => f.top[0]).map(f => ` — ${f.setor}: ${f.top[0]!.faixa} (${f.top[0]!.dias} dias)`).join(';')}.`);
  const sobra = lista.filter(d => d.equipe > d.necessario); const falta = lista.filter(d => d.contratacoes > 0);
  if (sobra.length && falta.length) conclusao.push(`Antes de contratar, avalie remanejar pessoas de ${sobra.map(d => `${d.setor} (sobra de ${d.equipe - d.necessario})`).join(', ')} para ${falta.map(d => d.setor).join(', ')}.`);
  const inv = he.filter(h => h.inviavel); if (inv.length) conclusao.push(`Cobrir com hora extra é inviável em ${inv.map(h => h.setor).join(', ')}: passaria de 2h extras por dia por pessoa.`);
  return { dims: lista, equipe, necessario, contratacoes, custo, sem, com, he, conclusao, horasDescobertas, contagem };
}
export function resumoTurnos(cfg: EscalaConfig, d: Dimensionamento) {
  const sc = setorCfg(cfg, d.setor); const b = sc.abre + '–' + sc.fecha; const rel = turnoRelogio(d.horas, d.regime);
  return { funcionamento: b, relogio: fmtH(rel), porDia: `${turnosPorDia(d.turnos, 0)} · ${turnosPorDia(d.turnos, 5)} · ${turnosPorDia(d.turnos, 6)}` };
}
export function viabilidadeTexto(cfg: EscalaConfig, setor: string) { const r = regimeSetor(cfg, setor); return viabilidadeCarga(setorCfg(cfg, setor), r.regime, r.horas); }
export const setoresDe = (colabs: Colab[]) => [...new Set(colabs.map(setorDe))];
export const faixa = (t: { ini: number; fim: number } | null) => (t ? `${fmt(t.ini)}–${fmt(t.fim)}` : '—');
