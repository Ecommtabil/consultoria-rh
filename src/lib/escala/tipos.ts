export type Regime = '6x1' | '5x2';
export type Cenario = 'atual' | 'nova';
export type Horario = { ini: number; fim: number } | null;
export type SetorConfig = {
  dias?: number[] | undefined; abre?: string | undefined; fecha?: string | undefined;
  sabAbre?: string | undefined; sabFecha?: string | undefined; domAbre?: string | undefined; domFecha?: string | undefined;
  semContratar?: boolean | undefined; completarCarga?: boolean | undefined; rodizioSab?: 0 | 2 | 3 | 4 | undefined;
  nova?: string | undefined; postos?: number | null | undefined;
};
export type EscalaConfig = {
  empresa: { abre: string; fecha: string; dias: number[] };
  nova: { tipo: Regime; horas: number; domingo: 0 | 3 | 4 | 7; encargos: number };
  setores: Record<string, SetorConfig>;
};
export type Colab = {
  id: string; nome: string | null; setor: string | null; sexo: string | null; cargo?: string | null; matricula?: string | null;
  jornada_atual: string | null; horas_semanais: number | null; entrada: string | null; saida: string | null;
  sab_modo: string; sab_entrada: string | null; sab_saida: string | null;
  dom_modo: string; dom_entrada: string | null; dom_saida: string | null;
  salario: number | null; nova_jornada: string;
};
export type FeriasReg = { colaborador_id: string; inicio: string; fim: string };
export type Celula = { c: string; e?: 1; w?: string; alm?: string | null };
export type PessoaEsc = { id: string; nome: string; setor: string; sexo: string | null; regime: Regime; horas: number; grupo: number; contratacao?: boolean | undefined };
export type SetorEsc = { postos: number; horarios: ([number, number] | null)[]; completar: boolean };
export type EscalaDados = {
  versao: 2; mes: string; cenario: Cenario; geradaEm: string; dias: string[];
  pessoas: PessoaEsc[]; codigos: Record<string, [number, number]>; grade: Record<string, Celula[]>;
  setores: Record<string, SetorEsc>; avisos: string[];
};
export const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const DIAS_LONGO = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
export const SEM_SETOR = 'Sem setor';
export const CORES_TURNO = ['#1D4ED8', '#60A5FA', '#1E3A8A', '#93C5FD', '#475569', '#94A3B8'];

export const configPadrao = (): EscalaConfig => ({
  empresa: { abre: '08:00', fecha: '18:00', dias: [0, 1, 2, 3, 4, 5] },
  nova: { tipo: '5x2', horas: 42, domingo: 3, encargos: 70 }, setores: {},
});
export function lerConfig(raw: unknown): EscalaConfig {
  const base = configPadrao(); const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<EscalaConfig>;
  return { empresa: { ...base.empresa, ...(r.empresa ?? {}) }, nova: { ...base.nova, ...(r.nova ?? {}) }, setores: { ...(r.setores ?? {}) } };
}
