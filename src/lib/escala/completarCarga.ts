import type { Horario } from './tipos';
import { trabalhoJanela } from './regime';
const trab = (h: Horario) => (h ? trabalhoJanela(h.fim - h.ini) : 0);
function janelaParaTrabalho(t: number) { let j = Math.ceil(t); while (trabalhoJanela(j) < t) j++; return j; }
/** Alonga igualmente os dias trabalhados (fim até o fechamento, depois entrada até a abertura), máx. 10h/dia. */
export function completarCarga(dias: Horario[], setor: Horario[], carga: number) {
  const out: Horario[] = dias.map(h => (h ? { ...h } : null));
  for (let it = 0; it < 30; it++) {
    const total = out.reduce((s, h) => s + trab(h), 0); const def = carga - total; if (def <= 0) break;
    const ext = out.map((h, i) => i).filter(i => { const h = out[i]; const s = setor[i]; return h && s && trab(h) < 600 && (h.fim < s.fim || h.ini > s.ini); });
    if (!ext.length) break; const share = Math.ceil(def / ext.length);
    for (const i of ext) {
      const h = out[i]!; const s = setor[i]!; const alvo = Math.min(600, trab(h) + share);
      let inc = janelaParaTrabalho(alvo) - (h.fim - h.ini); if (inc <= 0) continue;
      const e = Math.min(s.fim - h.fim, inc); h.fim += e; inc -= e; h.ini -= Math.min(h.ini - s.ini, inc);
    }
  }
  const total = out.reduce((s, h) => s + trab(h), 0);
  return { janelas: out, total, falta: Math.max(0, carga - total) };
}
