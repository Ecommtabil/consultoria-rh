import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { Shell, PageHeading, NoClient } from '@/components/governanca/shell';
import { SideRail } from '@/components/governanca/SideRail';
import { useApp } from '@/components/governanca/provider';
import { Button } from '@/components/ui/button';
import { Estrutura } from '@/components/cargos/Estrutura';
import { Matriz } from '@/components/cargos/Matriz';
import { Trilhas } from '@/components/cargos/Trilhas';
import { Docs } from '@/components/documentos/Docs';
const ABAS = [['estrutura', 'Estrutura de cargos'], ['matriz', 'Matriz salarial'], ['trilhas', 'Trilhas de carreira'], ['plano', 'Plano (documento)']] as const;
type Aba = (typeof ABAS)[number][0];
export const Route = createFileRoute('/_authenticated/cargos')({ head: () => ({ meta: [{ title: 'Cargos e salários | Kit Governança Interna' }, { name: 'description', content: 'Estrutura de cargos, matriz salarial, trilhas de carreira e Plano de Cargos, Salários e Carreira do cliente.' }, { property: 'og:title', content: 'Cargos e salários | Kit Governança Interna' }, { property: 'og:description', content: 'Faixas salariais, trilhas de carreira e plano em Word e PDF.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }), component: CargosPage });
function CargosPage() {
  const { selected } = useApp(); const [aba, setAba] = useState<Aba>('estrutura');
  return <Shell><div className="page-content"><PageHeading eyebrow="ETAPA 05 · KIT DO CLIENTE" title="Cargos e salários" description={selected?.nome} action={selected && <Button asChild variant="ghost"><Link to="/empresa"><Building2 />Dados da empresa</Link></Button>} />
    {!selected ? <NoClient /> : <div className="rail-layout">
      <SideRail caption="Cargos e salários">{ABAS.map(([id, l], i) => <button key={id} type="button" className={`side-rail-item ${aba === id ? 'active' : ''}`} onClick={() => setAba(id)}><span className="rail-num">{i + 1}</span><span>{l}</span></button>)}</SideRail>
      <div className="rail-body"><div key={selected.id}>{aba === 'estrutura' ? <Estrutura clienteId={selected.id} /> : aba === 'matriz' ? <Matriz clienteId={selected.id} empresa={selected.nome} /> : aba === 'trilhas' ? <Trilhas clienteId={selected.id} /> : <Docs client={selected} somente="plano" />}</div></div></div>}
  </div></Shell>;
}
