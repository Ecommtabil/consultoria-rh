import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Shell, PageHeading, NoClient } from '@/components/governanca/shell';
import { SideRail } from '@/components/governanca/SideRail';
import { useApp } from '@/components/governanca/provider';
import { Vagas, Candidatos } from '@/components/recrutamento/Recrutamento';
const ABAS = [['candidatos', 'Candidatos e laudos'], ['vagas', 'Vagas e método de avaliação']] as const;
type Aba = (typeof ABAS)[number][0];
export const Route = createFileRoute('/_authenticated/recrutamento')({ head: () => ({ meta: [{ title: 'Recrutamento e seleção | Kit Governança Interna' }, { name: 'description', content: 'Receba currículos em PDF, organize por vaga, veja a análise do candidato e gere o laudo de avaliação.' }, { property: 'og:title', content: 'Recrutamento e seleção | Kit Governança Interna' }, { property: 'og:description', content: 'Currículos por vaga, análise do candidato e laudo em PDF.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }), component: Page });
function Page() {
  const { selected } = useApp(); const [aba, setAba] = useState<Aba>('candidatos');
  return <Shell><div className="page-content"><PageHeading eyebrow="KIT DO CLIENTE" title="Recrutamento e seleção" description={selected?.nome} />
    {!selected ? <NoClient /> : <div className="rail-layout">
      <SideRail caption="Recrutamento e seleção">{ABAS.map(([id, l], i) => <button key={id} type="button" className={`side-rail-item ${aba === id ? 'active' : ''}`} onClick={() => setAba(id)}><span className="rail-num">{i + 1}</span><span>{l}</span></button>)}</SideRail>
      <div className="rail-body" key={selected.id}>{aba === 'vagas' ? <Vagas client={selected} /> : <Candidatos client={selected} />}</div></div>}
  </div></Shell>;
}
