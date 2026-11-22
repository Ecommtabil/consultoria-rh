import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileDown, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Shell, PageHeading, NoClient } from '@/components/governanca/shell';
import { GeradorRegimento } from '@/components/regimento/Gerador';
import { MODELOS } from '@/lib/regimento/montar';
import { useApp } from '@/components/governanca/provider';
import { supabase } from '@/integrations/supabase/client';
import type { Cliente } from '@/lib/governanca';
import { montar, segmentos, NOMES, PENDENCIAS, preenchido, type Bloco, type DocId, type Documento } from '@/lib/documentos/blocos';
export const Route=createFileRoute('/_authenticated/documentos')({head:()=>({meta:[{title:"Documentos | Kit Governança Interna"},{name:'description',content:"Regimento Interno, Código de Ética e Termo de Ciência com pré-visualização e download em Word e PDF."},{property:'og:title',content:"Documentos | Kit Governança Interna"},{property:'og:description',content:"Documentos de governança gerados com os dados do cliente."},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:DocsPage});
import { Docs } from '@/components/documentos/Docs';
function DocsPage(){const {selected}=useApp();return <Shell><div className="page-content"><PageHeading eyebrow="ETAPA 03 · KIT DO CLIENTE" title="Normas e políticas internas" description={selected?.nome}/>{selected?<Docs key={selected.id} client={selected}/>:<NoClient/>}</div></Shell>;}
