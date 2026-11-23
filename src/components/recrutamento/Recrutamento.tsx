import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, Sparkles, FileDown, Loader2, ArrowLeft, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Cliente } from '@/lib/governanca';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CRITERIOS_PADRAO, novoId, notaFinal, classificacao, notasIniciais, type Analise, type Criterio } from '@/lib/recrutamento/avaliacao';
import { analisarCandidato } from '@/lib/recrutamento/analisar.functions';
import { gerarLaudo } from '@/lib/recrutamento/laudo';

type Vaga = { id: string; titulo: string; descricao: string; requisitos: string; status: string; criterios: Criterio[] };
type Cand = { id: string; vaga_id: string | null; nome: string; email: string; telefone: string; arquivo_path: string | null; arquivo_nome: string; analise: Analise | null; notas: Record<string, number>; parecer: string; status: string };
const STATUS: Record<string, string> = { novo: 'Novo', analisado: 'Analisado', entrevista: 'Entrevista', aprovado: 'Aprovado', reprovado: 'Reprovado' };
const tom = (t: string) => (t === 'ok' ? 'ok' : t === 'medio' ? 'warn' : 'bad');

function useVagas(clienteId: string) {
  return useQuery({ queryKey: ['vagas', clienteId], queryFn: async () => { const { data, error } = await supabase.from('vagas').select('*').eq('cliente_id', clienteId).order('criado_em'); if (error) throw error; return (data ?? []) as unknown as Vaga[]; } });
}
function useCands(clienteId: string) {
  return useQuery({ queryKey: ['candidatos', clienteId], queryFn: async () => { const { data, error } = await supabase.from('candidatos').select('*').eq('cliente_id', clienteId).order('criado_em', { ascending: false }); if (error) throw error; return (data ?? []) as unknown as Cand[]; } });
}

export function Vagas({ client }: { client: Cliente }) {
  const qc = useQueryClient(); const { data: vagas = [] } = useVagas(client.id);
  const [aberta, setAberta] = useState<string | null>(null);
  const salvar = async (v: Vaga) => { const { error } = await supabase.from('vagas').update({ titulo: v.titulo, descricao: v.descricao, requisitos: v.requisitos, status: v.status, criterios: v.criterios as never }).eq('id', v.id); if (error) toast.error('Erro ao salvar a vaga'); else { toast.success('Vaga salva'); qc.invalidateQueries({ queryKey: ['vagas', client.id] }); } };
  const criar = async () => { const { data, error } = await supabase.from('vagas').insert({ cliente_id: client.id, titulo: 'Nova vaga', criterios: CRITERIOS_PADRAO.map(c => ({ ...c, id: novoId() })) as never }).select().single(); if (error) { toast.error('Erro ao criar vaga'); return; } await qc.invalidateQueries({ queryKey: ['vagas', client.id] }); setAberta(data.id); };
  const excluir = async (id: string) => { if (!confirm('Excluir esta vaga? Os candidatos ficam sem vaga.')) return; await supabase.from('vagas').delete().eq('id', id); qc.invalidateQueries({ queryKey: ['vagas', client.id] }); qc.invalidateQueries({ queryKey: ['candidatos', client.id] }); };
  return <div className="ez-card">
    <div className="ez-card-head"><div><h2>Vagas e método de avaliação</h2><p className="text-sm text-muted-foreground">Cada vaga tem seus critérios e pesos. A IA dá a nota de cada critério e você ajusta.</p></div><Button onClick={criar}><Plus />Nova vaga</Button></div>
    {!vagas.length && <p className="text-sm text-muted-foreground">Nenhuma vaga cadastrada.</p>}
    {vagas.map(v => aberta === v.id ? <EditorVaga key={v.id} vaga={v} onSalvar={async x => { await salvar(x); setAberta(null); }} onFechar={() => setAberta(null)} /> :
      <div key={v.id} className="flex items-center justify-between gap-3 border-t pt-3">
        <div><strong>{v.titulo}</strong> <span className={`ez-badge ${v.status === 'aberta' ? 'ok' : ''}`}>{v.status === 'aberta' ? 'Aberta' : 'Encerrada'}</span><p className="text-xs text-muted-foreground">{v.criterios.length} critérios · soma dos pesos {v.criterios.reduce((s, c) => s + c.peso, 0)}</p></div>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setAberta(v.id)}>Editar</Button><Button variant="ghost" size="icon" aria-label="Excluir vaga" onClick={() => excluir(v.id)}><Trash2 /></Button></div>
      </div>)}
  </div>;
}

function EditorVaga({ vaga, onSalvar, onFechar }: { vaga: Vaga; onSalvar: (v: Vaga) => Promise<void>; onFechar: () => void }) {
  const [v, setV] = useState(vaga);
  const setC = (id: string, patch: Partial<Criterio>) => setV({ ...v, criterios: v.criterios.map(c => c.id === id ? { ...c, ...patch } : c) });
  return <div className="flex flex-col gap-3 border-t pt-3">
    <div className="grid gap-3 md:grid-cols-[1fr_160px]">
      <label className="text-sm">Título da vaga<Input value={v.titulo} onChange={e => setV({ ...v, titulo: e.target.value })} /></label>
      <label className="text-sm">Situação<select className="h-9 w-full rounded-md border bg-background px-2" value={v.status} onChange={e => setV({ ...v, status: e.target.value })}><option value="aberta">Aberta</option><option value="encerrada">Encerrada</option></select></label>
    </div>
    <label className="text-sm">Descrição e atividades<Textarea rows={3} value={v.descricao} onChange={e => setV({ ...v, descricao: e.target.value })} /></label>
    <label className="text-sm">Requisitos (obrigatórios e desejáveis)<Textarea rows={3} value={v.requisitos} onChange={e => setV({ ...v, requisitos: e.target.value })} /></label>
    <h3 className="font-semibold">Critérios de avaliação</h3>
    {v.criterios.map(c => <div key={c.id} className="grid gap-2 md:grid-cols-[200px_1fr_80px_auto] items-end">
      <Input aria-label="Critério" value={c.nome} onChange={e => setC(c.id, { nome: e.target.value })} />
      <Input aria-label="O que avaliar" value={c.descricao} onChange={e => setC(c.id, { descricao: e.target.value })} />
      <Input aria-label="Peso" type="number" min={0} max={10} value={c.peso} onChange={e => setC(c.id, { peso: Number(e.target.value) })} />
      <Button variant="ghost" size="icon" aria-label="Remover critério" onClick={() => setV({ ...v, criterios: v.criterios.filter(x => x.id !== c.id) })}><Trash2 /></Button>
    </div>)}
    <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setV({ ...v, criterios: [...v.criterios, { id: novoId(), nome: 'Novo critério', descricao: '', peso: 1 }] })}><Plus />Adicionar critério</Button><span className="flex-1" /><Button variant="ghost" onClick={onFechar}>Cancelar</Button><Button onClick={() => onSalvar(v)}>Salvar vaga</Button></div>
  </div>;
}

export function Candidatos({ client }: { client: Cliente }) {
  const qc = useQueryClient(); const { data: vagas = [] } = useVagas(client.id); const { data: cands = [] } = useCands(client.id);
  const [vagaUp, setVagaUp] = useState(''); const [filtro, setFiltro] = useState('todas'); const [abertoId, setAbertoId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false); const ref = useRef<HTMLInputElement>(null);
  const analisar = useServerFn(analisarCandidato);
  const [analisando, setAnalisando] = useState<Set<string>>(new Set());
  const rodar = async (id: string) => {
    setAnalisando(s => new Set(s).add(id));
    try { const r = await analisar({ data: { candidatoId: id } }); if (!r.ok) toast.error(r.erro); else toast.success('Análise concluída'); }
    catch { toast.error('A análise falhou. Tente novamente.'); }
    finally { setAnalisando(s => { const n = new Set(s); n.delete(id); return n; }); qc.invalidateQueries({ queryKey: ['candidatos', client.id] }); }
  };
  const enviar = async (files: FileList | null) => {
    if (!files?.length) return; setEnviando(true); const novos: string[] = [];
    for (const f of Array.from(files)) {
      if (f.type !== 'application/pdf') { toast.error(`${f.name}: envie apenas PDF`); continue; }
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name}: maior que 10 MB`); continue; }
      const path = `${client.id}/${crypto.randomUUID()}.pdf`;
      const up = await supabase.storage.from('curriculos').upload(path, f, { contentType: 'application/pdf' });
      if (up.error) { toast.error(`${f.name}: falha no envio`); continue; }
      const { data, error } = await supabase.from('candidatos').insert({ cliente_id: client.id, vaga_id: vagaUp || null, arquivo_path: path, arquivo_nome: f.name }).select('id').single();
      if (error) toast.error(`${f.name}: falha ao registrar`); else novos.push(data.id);
    }
    setEnviando(false); if (ref.current) ref.current.value = '';
    await qc.invalidateQueries({ queryKey: ['candidatos', client.id] });
    for (const id of novos) await rodar(id);
  };
  const aberto = cands.find(c => c.id === abertoId);
  if (aberto) return <FichaCandidato client={client} cand={aberto} vagas={vagas} analisando={analisando.has(aberto.id)} onAnalisar={() => rodar(aberto.id)} onVoltar={() => setAbertoId(null)} />;
  const vagaDe = (id: string | null) => vagas.find(v => v.id === id);
  const lista = cands.filter(c => filtro === 'todas' || (filtro === 'sem' ? !c.vaga_id : c.vaga_id === filtro))
    .map(c => ({ c, nota: notaFinal(vagaDe(c.vaga_id)?.criterios ?? [], notasIniciais(vagaDe(c.vaga_id)?.criterios ?? [], c.analise, c.notas)) }))
    .sort((a, b) => b.nota - a.nota);
  return <div className="flex flex-col gap-4">
    <div className="ez-card">
      <div className="ez-card-head"><div><h2>Receber currículos</h2><p className="text-sm text-muted-foreground">Selecione a vaga e envie um ou vários PDFs. A análise começa sozinha.</p></div></div>
      <div className="flex flex-wrap gap-2 items-center">
        <select aria-label="Vaga dos currículos" className="h-9 rounded-md border bg-background px-2" value={vagaUp} onChange={e => setVagaUp(e.target.value)}><option value="">Sem vaga definida</option>{vagas.map(v => <option key={v.id} value={v.id}>{v.titulo}</option>)}</select>
        <input ref={ref} type="file" accept="application/pdf" multiple hidden onChange={e => enviar(e.target.files)} />
        <Button onClick={() => ref.current?.click()} disabled={enviando}>{enviando ? <Loader2 className="animate-spin" /> : <Upload />}Enviar currículos (PDF)</Button>
      </div>
    </div>
    <div className="ez-card">
      <div className="ez-card-head"><h2>Candidatos ({lista.length})</h2>
        <select aria-label="Filtrar por vaga" className="h-9 rounded-md border bg-background px-2" value={filtro} onChange={e => setFiltro(e.target.value)}><option value="todas">Todas as vagas</option>{vagas.map(v => <option key={v.id} value={v.id}>{v.titulo}</option>)}<option value="sem">Sem vaga</option></select></div>
      {!lista.length && <p className="text-sm text-muted-foreground">Nenhum candidato ainda.</p>}
      {lista.map(({ c, nota }) => { const cl = classificacao(nota); return <div key={c.id} className="flex items-center justify-between gap-3 border-t pt-3 flex-wrap">
        <div className="min-w-0"><strong>{c.nome || c.arquivo_nome}</strong> <span className="ez-badge">{STATUS[c.status] ?? c.status}</span>
          <p className="text-xs text-muted-foreground">{vagaDe(c.vaga_id)?.titulo ?? 'Sem vaga'}{c.analise ? ` · ${c.analise.experiencia_anos} anos de experiência` : ''}</p></div>
        <div className="flex items-center gap-2">
          {analisando.has(c.id) ? <span className="text-xs flex items-center gap-1"><Loader2 size={13} className="animate-spin" />Analisando…</span> : c.analise ? <span className={`ez-badge ${tom(cl.tom)}`}>{nota}/100 · {cl.rotulo}</span> : <Button size="sm" variant="outline" onClick={() => rodar(c.id)}><Sparkles />Analisar</Button>}
          <Button size="sm" onClick={() => setAbertoId(c.id)}>Abrir</Button>
        </div></div>; })}
    </div>
  </div>;
}

function FichaCandidato({ client, cand, vagas, analisando, onAnalisar, onVoltar }: { client: Cliente; cand: Cand; vagas: Vaga[]; analisando: boolean; onAnalisar: () => void; onVoltar: () => void }) {
  const qc = useQueryClient(); const vaga = vagas.find(v => v.id === cand.vaga_id) ?? null; const crit = vaga?.criterios ?? [];
  const [f, setF] = useState({ nome: cand.nome, email: cand.email, telefone: cand.telefone, parecer: cand.parecer, status: cand.status, vaga_id: cand.vaga_id ?? '', notas: notasIniciais(crit, cand.analise, cand.notas) });
  const a = cand.analise; const nota = notaFinal(crit, f.notas); const cl = classificacao(nota);
  const salvar = useMutation({ mutationFn: async () => { const { error } = await supabase.from('candidatos').update({ nome: f.nome, email: f.email, telefone: f.telefone, parecer: f.parecer, status: f.status, vaga_id: f.vaga_id || null, notas: f.notas as never }).eq('id', cand.id); if (error) throw error; }, onSuccess: () => { toast.success('Avaliação salva'); qc.invalidateQueries({ queryKey: ['candidatos', client.id] }); }, onError: () => toast.error('Erro ao salvar') });
  const verPdf = async () => { if (!cand.arquivo_path) return; const { data } = await supabase.storage.from('curriculos').createSignedUrl(cand.arquivo_path, 300); if (data) window.open(data.signedUrl, '_blank'); };
  const excluir = async () => { if (!confirm('Excluir este candidato e o currículo?')) return; if (cand.arquivo_path) await supabase.storage.from('curriculos').remove([cand.arquivo_path]); await supabase.from('candidatos').delete().eq('id', cand.id); qc.invalidateQueries({ queryKey: ['candidatos', client.id] }); onVoltar(); };
  return <div className="flex flex-col gap-4">
    <div className="flex flex-wrap gap-2"><Button variant="ghost" onClick={onVoltar}><ArrowLeft />Voltar</Button><span className="flex-1" />
      <Button variant="outline" onClick={verPdf}><Eye />Ver currículo</Button>
      <Button variant="outline" onClick={onAnalisar} disabled={analisando}>{analisando ? <Loader2 className="animate-spin" /> : <Sparkles />}{a ? 'Refazer análise' : 'Analisar'}</Button>
      <Button onClick={() => gerarLaudo({ nome: client.nome, cnpj: client.cnpj }, vaga, crit, { ...f, analise: a })}><FileDown />Gerar laudo (PDF)</Button>
      <Button variant="ghost" size="icon" aria-label="Excluir candidato" onClick={excluir}><Trash2 /></Button></div>
    <div className="ez-grid2">
      <div className="ez-card">
        <div className="ez-card-head"><h2>Dados do candidato</h2>{a && <span className={`ez-badge ${tom(cl.tom)}`}>{nota}/100 · {cl.rotulo}</span>}</div>
        <label className="text-sm">Nome<Input value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} /></label>
        <div className="grid gap-3 md:grid-cols-2"><label className="text-sm">E-mail<Input value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label><label className="text-sm">Telefone<Input value={f.telefone} onChange={e => setF({ ...f, telefone: e.target.value })} /></label></div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">Vaga<select className="h-9 w-full rounded-md border bg-background px-2" value={f.vaga_id} onChange={e => setF({ ...f, vaga_id: e.target.value })}><option value="">Sem vaga</option>{vagas.map(v => <option key={v.id} value={v.id}>{v.titulo}</option>)}</select></label>
          <label className="text-sm">Etapa<select className="h-9 w-full rounded-md border bg-background px-2" value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>{Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        </div>
        {f.vaga_id !== (cand.vaga_id ?? '') && <p className="text-xs text-muted-foreground">Salve e refaça a análise para avaliar pelos critérios da nova vaga.</p>}
        {analisando ? <p className="text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" />A IA está lendo o currículo…</p> : !a ? <p className="text-sm text-muted-foreground">Ainda sem análise.</p> : <>
          <h3 className="font-semibold">Resumo</h3><p className="text-sm">{a.resumo}</p>
          <p className="text-sm"><strong>Formação:</strong> {a.formacao || '—'}</p>
          <p className="text-sm"><strong>Experiência:</strong> {a.experiencia_anos} anos{a.cargos_anteriores.length ? ` — ${a.cargos_anteriores.join('; ')}` : ''}</p>
          <Lista t="Pontos fortes" itens={a.pontos_fortes} /><Lista t="Pontos de atenção" itens={a.pontos_atencao} /><Lista t="Perguntas sugeridas para a entrevista" itens={a.perguntas_entrevista} />
        </>}
      </div>
      <div className="ez-card">
        <div className="ez-card-head"><div><h2>Avaliação</h2><p className="text-sm text-muted-foreground">Notas de 0 a 5. A IA sugere; você decide.</p></div></div>
        {!crit.length && <p className="text-sm text-muted-foreground">Vincule a uma vaga com critérios para pontuar.</p>}
        {crit.map(c => { const j = a?.criterios.find(x => x.id === c.id); return <div key={c.id} className="border-t pt-2">
          <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{c.nome} <span className="text-xs text-muted-foreground">peso {c.peso}</span></span>
            <Input aria-label={`Nota ${c.nome}`} className="w-20" type="number" min={0} max={5} step={0.5} value={f.notas[c.id] ?? ''} onChange={e => setF({ ...f, notas: { ...f.notas, [c.id]: Number(e.target.value) } })} /></div>
          {j && <p className="text-xs text-muted-foreground">IA ({j.nota}): {j.justificativa}</p>}</div>; })}
        <div className="border-t pt-3 text-sm"><strong>Nota final: {nota}/100</strong> — {cl.rotulo}</div>
        <label className="text-sm">Parecer do avaliador<Textarea rows={5} value={f.parecer} onChange={e => setF({ ...f, parecer: e.target.value })} placeholder="Conclusão sobre o candidato, resultado da entrevista…" /></label>
        <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>Salvar avaliação</Button>
      </div>
    </div>
  </div>;
}
function Lista({ t, itens }: { t: string; itens: string[] }) { if (!itens.length) return null; return <div><h3 className="font-semibold text-sm">{t}</h3><ul className="list-disc pl-5 text-sm">{itens.map((x, i) => <li key={i}>{x}</li>)}</ul></div>; }
