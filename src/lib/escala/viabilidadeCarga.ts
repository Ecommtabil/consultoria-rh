import type { Regime, SetorConfig } from './tipos';
import { diasTrabalho, intervaloJanela, intervaloTrabalho, jornadaDiaria, trabalhoJanela } from './regime';
import { horarioBase, horarioDia, minutos, type SetorResolvido } from './operacao';
import { fmt, fmtH } from './tempo';
export type Acao = { rotulo: string; patch: Partial<SetorConfig> };
export type Viabilidade = { ok: boolean; problemas: { texto: string; acoes: Acao[] }[]; alternativas: string[]; sugerirCompletar: boolean };
const janelaPara = (trab: number) => trab + intervaloTrabalho(trab);
export function viabilidadeCarga(sc: SetorResolvido, regime: Regime, horas: number): Viabilidade {
  const carga = horas * 60; const base = horarioBase(sc); const problemas: Viabilidade['problemas'] = []; let sugerirCompletar = false;
  const abertos = [0, 1, 2, 3, 4, 5, 6].filter(d => horarioDia(sc, d));
  if (!base || abertos.length === 0) return { ok: false, problemas: [{ texto: 'Setor sem horário de funcionamento.', acoes: [] }], alternativas: [], sugerirCompletar };
  const k = Math.min(diasTrabalho(regime), abertos.length);
  const maxBase = Math.min(600, minutos(base) - intervaloJanela(minutos(base)));
  const normal = k * maxBase;
  if (normal < carga) {
    const trab = carga / k; const acoes: Acao[] = [];
    if (trab <= 600) acoes.push({ rotulo: `Fechar às ${fmt(base.ini + janelaPara(trab))} nos dias úteis`, patch: { fecha: fmt(base.ini + janelaPara(trab)) } });
    problemas.push({ texto: `${k} × ${fmtH(maxBase)} = ${fmtH(normal)}. Faltam ${fmtH(carga - normal)} para as ${horas}h.`, acoes });
  } else {
    for (const d of [5, 6]) {
      const h = horarioDia(sc, d); if (!h || minutos(h) >= minutos(base)) continue;
      const curto = Math.min(600, trabalhoJanela(minutos(h))); const semana = (k - 1) * maxBase + curto; const nome = d === 5 ? 'sábado' : 'domingo';
      if (semana < carga) {
        const acoes: Acao[] = []; const trabCurto = carga - (k - 1) * maxBase;
        if (trabCurto <= 600) { const f = fmt(h.ini + janelaPara(trabCurto)); acoes.push({ rotulo: `Estender o ${nome} até ${f}`, patch: d === 5 ? { sabAbre: fmt(h.ini), sabFecha: f } : { domAbre: fmt(h.ini), domFecha: f } }); }
        const trabUtil = (carga - curto) / (k - 1);
        if (trabUtil <= 600) { const f = fmt(base.ini + janelaPara(trabUtil)); acoes.push({ rotulo: `Fechar às ${f} nos dias úteis`, patch: { fecha: f } }); }
        problemas.push({ texto: `Semana com ${nome} curto: ${k - 1} × ${fmtH(maxBase)} + ${fmtH(curto)} = ${fmtH(semana)}. Faltam ${fmtH(carga - semana)} para as ${horas}h.`, acoes });
      } else if (!sc.completarCarga && (k - 1) * jornadaDiaria(horas, regime) + curto < carga) sugerirCompletar = true;
    }
  }
  const alternativas = problemas.length ? ['Almoço de 30 min (exige CCT/ACT — CLT art. 611-A, III).', 'Hora extra paga para cobrir a diferença.', 'Rodízio para que o dia curto não pese na mesma pessoa toda semana.'] : [];
  return { ok: problemas.length === 0 && !sugerirCompletar, problemas, alternativas, sugerirCompletar };
}
