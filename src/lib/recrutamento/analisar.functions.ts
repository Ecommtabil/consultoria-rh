import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Analise, Criterio } from './avaliacao';

const MODEL = 'openai/gpt-6.1-sol';
const lista = { type: 'array', items: { type: 'string' } };
function schema() {
  return {
    type: 'object', additionalProperties: false,
    required: ['nome', 'email', 'telefone', 'resumo', 'formacao', 'experiencia_anos', 'cargos_anteriores', 'pontos_fortes', 'pontos_atencao', 'perguntas_entrevista', 'criterios', 'recomendacao'],
    properties: {
      nome: { type: 'string' }, email: { type: 'string' }, telefone: { type: 'string' },
      resumo: { type: 'string' }, formacao: { type: 'string' }, experiencia_anos: { type: 'number' },
      cargos_anteriores: lista, pontos_fortes: lista, pontos_atencao: lista, perguntas_entrevista: lista,
      criterios: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'nota', 'justificativa'], properties: { id: { type: 'string' }, nota: { type: 'number' }, justificativa: { type: 'string' } } } },
      recomendacao: { type: 'string', enum: ['recomendado', 'avaliar', 'nao_recomendado'] },
    },
  };
}
function toBase64(bytes: Uint8Array) {
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export const analisarCandidato = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { candidatoId: string }) => { if (!d?.candidatoId) throw new Error('Candidato ausente'); return d; })
  .handler(async ({ data, context }): Promise<{ ok: true; analise: Analise } | { ok: false; erro: string }> => {
    const sb = context.supabase;
    const { data: cand, error } = await sb.from('candidatos').select('*').eq('id', data.candidatoId).single();
    if (error || !cand) return { ok: false, erro: 'Candidato não encontrado.' };
    if (!cand.arquivo_path) return { ok: false, erro: 'Este candidato não tem currículo em PDF.' };
    const vaga = cand.vaga_id ? (await sb.from('vagas').select('*').eq('id', cand.vaga_id).single()).data : null;
    const criterios = ((vaga?.criterios ?? []) as unknown as Criterio[]);
    const file = await sb.storage.from('curriculos').download(cand.arquivo_path);
    if (file.error || !file.data) return { ok: false, erro: 'Não foi possível abrir o PDF do currículo.' };
    const b64 = toBase64(new Uint8Array(await file.data.arrayBuffer()));
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { ok: false, erro: 'Serviço de IA não configurado.' };
    const instrucoes = [
      'Você é um analista de recrutamento e seleção brasileiro. Analise o currículo em PDF de forma objetiva, sem discriminar por idade, sexo, raça, religião, estado civil ou origem; não use esses dados na avaliação.',
      vaga ? `Vaga: ${vaga.titulo}\nDescrição: ${vaga.descricao || '-'}\nRequisitos: ${vaga.requisitos || '-'}` : 'Sem vaga definida: avalie o perfil geral.',
      criterios.length ? `Dê nota de 0 a 5 (pode usar meio ponto) para cada critério, usando exatamente estes ids:\n${criterios.map(c => `- id "${c.id}": ${c.nome} (peso ${c.peso}) — ${c.descricao}`).join('\n')}` : 'Não há critérios; devolva a lista criterios vazia.',
      'Escreva em português do Brasil. Use string vazia quando um dado de contato não aparecer. Resumo com até 5 frases. Sugira 5 perguntas de entrevista para esclarecer pontos de atenção.',
    ].join('\n\n');
    const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key, 'X-Lovable-AIG-SDK': 'fetch' },
      body: JSON.stringify({
        model: MODEL, stream: true, store: false,
        reasoning: { effort: 'low', summary: 'auto' }, include: ['reasoning.encrypted_content'],
        text: { format: { type: 'json_schema', name: 'analise_curriculo', strict: true, schema: schema() } },
        input: [{ role: 'user', content: [{ type: 'input_text', text: instrucoes }, { type: 'input_file', filename: cand.arquivo_nome || 'curriculo.pdf', file_data: `data:application/pdf;base64,${b64}` }] }],
      }),
    });
    if (!res.ok || !res.body) {
      const msg = res.status === 402 ? 'Créditos de IA esgotados. Adicione créditos para continuar.' : res.status === 429 ? 'Muitas análises ao mesmo tempo. Tente novamente em instantes.' : `A análise falhou (erro ${res.status}).`;
      console.error('analise IA', res.status, await res.text().catch(() => ''));
      return { ok: false, erro: msg };
    }
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ''; let texto = ''; let falha = '';
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i; while ((i = buf.indexOf('\n')) >= 0) {
        const linha = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!linha.startsWith('data:')) continue; const p = linha.slice(5).trim(); if (!p || p === '[DONE]') continue;
        try { const ev = JSON.parse(p); if (ev.type === 'response.output_text.delta') texto += ev.delta; else if (ev.type === 'response.failed' || ev.type === 'error') falha = ev.response?.error?.message ?? ev.message ?? 'falha'; } catch { /* linha parcial */ }
      }
    }
    if (falha || !texto) return { ok: false, erro: 'A IA não conseguiu analisar este currículo.' };
    let analise: Analise; try { analise = JSON.parse(texto) as Analise; } catch { return { ok: false, erro: 'Resposta da IA inválida. Tente novamente.' }; }
    const patch: { analise: never; status: string; nome?: string; email?: string; telefone?: string } = { analise: analise as never, status: cand.status === 'novo' ? 'analisado' : cand.status };
    if (!cand.nome && analise.nome) patch.nome = analise.nome;
    if (!cand.email && analise.email) patch.email = analise.email;
    if (!cand.telefone && analise.telefone) patch.telefone = analise.telefone;
    await sb.from('candidatos').update(patch).eq('id', cand.id);
    return { ok: true, analise };
  });
