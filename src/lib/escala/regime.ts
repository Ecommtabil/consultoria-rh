import type { Colab, EscalaConfig, Regime } from './tipos';
import { toMin } from './tempo';
export const diasTrabalho = (r: Regime) => (r === '6x1' ? 6 : 5);
/** CLT art. 71: intervalo pela duração do trabalho. */
export const intervaloTrabalho = (trab: number) => (trab > 360 ? 60 : trab > 240 ? 15 : 0);
/** Intervalo pela janela do dia (entrada→saída). */
export const intervaloJanela = (jan: number) => (jan > 375 ? 60 : jan > 255 ? 15 : 0);
export const trabalhoJanela = (jan: number) => jan - intervaloJanela(jan);
export const jornadaDiaria = (horas: number, r: Regime) => (horas * 60) / diasTrabalho(r);
export const turnoRelogio = (horas: number, r: Regime) => { const j = jornadaDiaria(horas, r); return j + intervaloTrabalho(j); };
export function parseNova(code: string | null | undefined): { regime: Regime; horas: number } | null {
  const m = /^(6x1|5x2)-(\d{2})$/.exec(String(code ?? '')); return m ? { regime: m[1] as Regime, horas: Number(m[2]) } : null;
}
export function explicaJornada(regime: Regime, horas: number, abertoMin: number) {
  const jornada = jornadaDiaria(horas, regime); const intervalo = intervaloTrabalho(jornada); const relogio = jornada + intervalo;
  const turnos = abertoMin > 0 ? Math.ceil(abertoMin / relogio) : 0;
  const avisos: string[] = [];
  if (jornada > 600) avisos.push('Jornada diária acima de 10h: inviável.');
  else if (jornada > 480) avisos.push('Jornada diária acima de 8h: exige acordo de compensação (CLT art. 59 §2º).');
  return { jornada, intervalo, relogio, turnos, avisos, dias: diasTrabalho(regime) };
}
export function regimeSetor(cfg: EscalaConfig, setor: string) {
  return parseNova(cfg.setores[setor]?.nova) ?? { regime: cfg.nova.tipo, horas: cfg.nova.horas };
}
export function regimeAtual(c: Colab): { regime: Regime; horas: number } {
  return { regime: c.jornada_atual === '5x2' ? '5x2' : '6x1', horas: Number(c.horas_semanais) || 44 };
}
/** Regime de uma pessoa no cenário; `individual` indica que não segue o setor. */
export function regimePessoa(c: Colab, cfg: EscalaConfig, setor: string, cenario: 'atual' | 'nova') {
  if (cenario === 'atual' || c.nova_jornada === 'manter') return { ...regimeAtual(c), individual: true, manter: true };
  const p = parseNova(c.nova_jornada); if (p) return { ...p, individual: true, manter: false };
  return { ...regimeSetor(cfg, setor), individual: false, manter: false };
}
export const ordemEntrada = (c: Colab) => { const m = toMin(c.entrada); return Number.isNaN(m) ? 9999 : m; };
