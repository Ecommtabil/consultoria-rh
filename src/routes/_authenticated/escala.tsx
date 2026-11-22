import { createFileRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { Shell, PageHeading, NoClient } from '@/components/governanca/shell';
import { SideRail } from '@/components/governanca/SideRail';
import { useApp } from '@/components/governanca/provider';
import { EscalaProvider } from '@/components/escala/contexto';
const SUB = [
  { to: '/escala/funcionamento', label: 'Funcionamento e jornada' }, { to: '/escala/equipe', label: 'Equipe e jornada atual' },
  { to: '/escala/comparativo', label: 'Comparativo' }, { to: '/escala/mensal', label: 'Escala mensal' },
  { to: '/escala/almocos', label: 'Almoços e folgas' }, { to: '/escala/quadro', label: 'Quadro semanal' },
] as const;
export const Route = createFileRoute('/_authenticated/escala')({
  head: () => ({ meta: [{ title: 'Escalas e dimensionamento | Kit Governança Interna' }, { name: 'description', content: 'Funcionamento, equipe, dimensionamento, escala mensal, almoços e quadro semanal do cliente.' }, { property: 'og:title', content: 'Escalas e dimensionamento | Kit Governança Interna' }, { property: 'og:description', content: 'Escalas de trabalho e dimensionamento de equipe por setor.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: EscalaLayout,
});
function EscalaLayout() {
  const { selected } = useApp(); const path = useLocation({ select: l => l.pathname });
  return <Shell><div className="page-content ez-page"><PageHeading eyebrow="ETAPA 04 · KIT DO CLIENTE" title="Escalas e dimensionamento" description={selected?.nome} />
    <div className="rail-layout">
      <SideRail caption="Escalas e dimensionamento">{SUB.map((s, i) => <Link key={s.to} to={s.to} className={`side-rail-item ${path === s.to ? 'active' : ''}`}><span className="rail-num">{i + 1}</span><span>{s.label}</span></Link>)}</SideRail>
      <div className="rail-body">{selected ? <EscalaProvider key={selected.id} client={selected}><Outlet /></EscalaProvider> : <NoClient />}</div>
    </div></div></Shell>;
}
