import { ArrowRight } from 'lucide-react';
import { brl, porFamilia, steps } from '@/lib/cargos/calc';
import { useCargos } from './dados';
export function Trilhas({ clienteId }: { clienteId: string }) {
  const { cargos, n, pct } = useCargos(clienteId);
  if (!cargos.length) return <p className="table-empty">Cadastre cargos em Estrutura de cargos.</p>;
  return <div className="cg-stack">{porFamilia(cargos).map(g => <section key={g.familia} className="cg-card"><h2>{g.familia}</h2>
    {(['Técnica', 'Gestão'] as const).map(t => { const cs = g.cargos.filter(c => (c.trilha === 'Gestão' ? 'Gestão' : 'Técnica') === t); return <div key={t} className="cg-lane"><h3>{t}</h3>
      {cs.length ? <div className="cg-lane-row">{cs.map((c, i) => { const s = steps(c.salario_base ?? 0, n, pct); return <div key={c.id} className="cg-lane-item">{i > 0 && <ArrowRight className="cg-arrow" size={18} />}
        <article className={`cg-step ${t === 'Gestão' ? 'ges' : 'tec'}`}><small>Nível {c.nivel}{c.tempo_minimo_meses ? ` · após ${c.tempo_minimo_meses} meses` : ''}</small><strong>{c.cargo}</strong><span className="tabular-nums">{brl(s[0]!)} a {brl(s.at(-1)!)}</span>{c.requisitos && <p>{c.requisitos}</p>}</article></div>; })}</div> : <p className="cg-muted">Nenhum cargo nesta trilha.</p>}</div>; })}
  </section>)}</div>;
}
