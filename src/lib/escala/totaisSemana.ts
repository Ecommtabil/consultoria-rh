import type { EscalaDados } from './tipos';
import { diasTrabalho, trabalhoJanela } from './regime';
import { diaSemana } from './tempo';
import type { Almoco } from './calcAlmocos';
export const semanas = (e: EscalaDados) => Array.from({ length: Math.ceil(e.dias.length / 7) }, (_, w) => e.dias.slice(w * 7, w * 7 + 7));
export type TotalPessoa = { id: string; nome: string; setor: string; dias: number; folgas: number; escaladas: number; fechada: number; domingo: number; ferias: number; horas: number; carga: number; saldo: number | null; situacao: string; minimo: number; parcial: boolean };
export function totaisSemana(e: EscalaDados, w: number, almocos?: Record<string, Almoco[]>): TotalPessoa[] {
  const idx = Array.from({ length: 7 }, (_, d) => w * 7 + d).filter(i => i < e.dias.length);
  const parcial = idx.some(i => !e.dias[i]!.startsWith(e.mes));
  return e.pessoas.map(p => {
    let dias = 0, escaladas = 0, fechada = 0, domingo = 0, ferias = 0, horas = 0;
    for (const i of idx) {
      const c = e.grade[p.id]?.[i]?.c ?? 'X'; const dom = diaSemana(e.dias[i]!) === 6;
      if (c === 'F') { escaladas++; if (dom) domingo++; } else if (c === 'X') fechada++; else if (c === 'FE') ferias++;
      else { const j = e.codigos[c]; if (!j) continue; dias++; const a = almocos?.[p.id]?.[i]; horas += a ? j[1] - j[0] - (a.fim - a.ini) : trabalhoJanela(j[1] - j[0]); }
    }
    const carga = p.horas * 60; const saldo = ferias ? null : horas - carga; const minimo = 7 - diasTrabalho(p.regime); const folgas = escaladas + fechada;
    const situacao = ferias ? 'Férias' : folgas < minimo ? `Falta ${minimo - folgas} folga${minimo - folgas > 1 ? 's' : ''}` : saldo! > 0 ? 'Hora extra' : saldo! < 0 ? 'Abaixo da carga' : 'Ok';
    return { id: p.id, nome: p.nome, setor: p.setor, dias, folgas, escaladas, fechada, domingo, ferias, horas, carga, saldo, situacao, minimo, parcial };
  });
}
