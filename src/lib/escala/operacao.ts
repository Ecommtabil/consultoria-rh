import type { EscalaConfig, Horario, SetorConfig } from './tipos';
import { janela } from './tempo';
export type SetorResolvido = Required<Pick<SetorConfig, 'dias' | 'abre' | 'fecha'>> & SetorConfig;
export function setorCfg(cfg: EscalaConfig, setor: string): SetorResolvido {
  const s = cfg.setores[setor] ?? {};
  return { ...s, dias: s.dias ?? cfg.empresa.dias, abre: s.abre || cfg.empresa.abre, fecha: s.fecha || cfg.empresa.fecha };
}
export function horarioDia(sc: SetorResolvido, d: number): Horario {
  if (!sc.dias.includes(d)) return null;
  if (d === 5 && sc.sabAbre && sc.sabFecha) return janela(sc.sabAbre, sc.sabFecha);
  if (d === 6 && sc.domAbre && sc.domFecha) return janela(sc.domAbre, sc.domFecha);
  return janela(sc.abre, sc.fecha);
}
export const horariosSemana = (sc: SetorResolvido) => [0, 1, 2, 3, 4, 5, 6].map(d => horarioDia(sc, d));
export const horarioBase = (sc: SetorResolvido) => janela(sc.abre, sc.fecha);
export const minutos = (h: Horario) => (h ? h.fim - h.ini : 0);
export const diasAbertos = (sc: SetorResolvido) => horariosSemana(sc).filter(Boolean).length;
