import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { DIAS } from '@/lib/escala';
export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export function Kpi({ icon: Icon, label, value, note, tone }: { icon: LucideIcon; label: string; value: ReactNode; note?: ReactNode; tone?: 'ok' | 'warn' | 'bad' }) {
  return <div className={`ez-kpi ${tone ?? ''}`}><span className="ez-kpi-icon"><Icon size={18} /></span><div><p>{label}</p><strong className="tabular">{value}</strong>{note && <small>{note}</small>}</div></div>;
}
export function Card({ title, desc, action, children, className }: { title?: ReactNode; desc?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`ez-card ${className ?? ''}`}>{(title || action) && <div className="ez-card-head"><div>{title && <h2>{title}</h2>}{desc && <p>{desc}</p>}</div>{action}</div>}{children}</section>;
}
export function DiaChips({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return <div className="ez-chips" role="group" aria-label="Dias da semana">{DIAS.map((d, i) => <button type="button" key={d} aria-pressed={value.includes(i)} className={value.includes(i) ? 'on' : ''} onClick={() => onChange(value.includes(i) ? value.filter(x => x !== i) : [...value, i].sort())}>{d}</button>)}</div>;
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) { return <label className="ez-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function ChartTip({ active, payload, label, fmt }: { active?: boolean; payload?: { name?: string; value?: unknown; color?: string; payload?: Record<string, unknown> }[]; label?: unknown; fmt?: (v: unknown, name?: string) => string }) {
  if (!active || !payload?.length) return null;
  return <div className="ez-tip"><strong>{String(label ?? '')}</strong>{payload.map((p, i) => <div key={i}><span style={{ background: p.color }} />{p.name}: <b>{fmt ? fmt(p.value, p.name) : String(p.value)}</b></div>)}</div>;
}
export const Gradiente = ({ id, de = '#3B82F6', ate = '#1D4ED8' }: { id: string; de?: string; ate?: string }) => <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={de} stopOpacity={0.95} /><stop offset="100%" stopColor={ate} stopOpacity={0.95} /></linearGradient></defs>;
export function Vazio({ children }: { children: ReactNode }) { return <div className="ez-empty">{children}</div>; }
