import jsPDF from 'jspdf';
import { cidadeData, nomeEmpresa, ordinal, REGIMENTO, type Empresa, type Modelo, type Montado, type Parte } from './montar';
type RGB = [number, number, number];
const GOLD: RGB = [147, 112, 47], OK: RGB = [61, 122, 74], BAD: RGB = [165, 69, 58], INK: RGB = [32, 43, 35], MUTED: RGB = [93, 106, 95], LINE: RGB = [200, 205, 195];
const ML = 22, MR = 22, MT = 20, MB = 22, PW = 210, PH = 297, W = PW - ML - MR;
const plano = (p: Parte[]) => p.map(x => x.text).join('');
export function gerarRegimentoPdf(m: Montado, e: Empresa, mod: Modelo = REGIMENTO): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }); let y = MT;
  const lh = (pt: number) => pt * 0.42;
  const need = (h: number) => { if (y + h > PH - MB) { doc.addPage(); y = MT; } };
  const font = (f: 'times' | 'helvetica', s: string, pt: number, c: RGB = INK) => { doc.setFont(f, s); doc.setFontSize(pt); doc.setTextColor(...c); };
  const centro = (t: string, pt: number) => { for (const l of doc.splitTextToSize(t, W) as string[]) { need(lh(pt) + 1); y += lh(pt); doc.text(l, PW / 2, y, { align: 'center' }); y += 1.2; } };
  /** Parágrafo justificado linha a linha (última linha alinhada à esquerda). */
  const justificado = (t: string, pt: number, x = ML, w = W) => {
    const ls = doc.splitTextToSize(t, w) as string[];
    ls.forEach((l, i) => { need(lh(pt) + 1); y += lh(pt);
      const ws = l.trim().split(/\s+/);
      if (i === ls.length - 1 || ws.length < 2) doc.text(l.trim(), x, y);
      else { const larg = ws.reduce((s, p) => s + doc.getTextWidth(p), 0); const gap = (w - larg) / (ws.length - 1); let cx = x; for (const p of ws) { doc.text(p, cx, y); cx += doc.getTextWidth(p) + gap; } }
      y += lh(pt) * 0.2; });
  };
  const emp = nomeEmpresa(e); const cd = cidadeData(e);
  // Timbre
  font('times', 'bold', 16); centro(emp.toUpperCase(), 16);
  if (e.cnpj.trim()) { font('times', 'normal', 9.5, MUTED); centro(`CNPJ: ${e.cnpj.trim()}`, 9.5); }
  y += 3; font('times', 'bold', 13); doc.setCharSpace(0.8); centro(mod.tituloDoc, 13); doc.setCharSpace(0);
  font('times', 'italic', 9.5, MUTED); centro(mod.subtituloDoc, 9.5);
  if (cd) { font('times', 'normal', 9, MUTED); centro(cd, 9); }
  y += 3; doc.setDrawColor(...INK); doc.setLineWidth(0.6); doc.line(ML, y, PW - MR, y); y += 6;
  // Introdução
  font('times', 'normal', 10, MUTED); for (const p of m.intro) { justificado(plano(p), 10); y += 2.5; }
  // Resumo
  if (m.pode.length || m.naoPode.length) {
    y += 3; need(24); font('helvetica', 'bold', 8.5, GOLD); doc.text('GUIA RÁPIDO', ML, y + 3); y += 5;
    font('times', 'bold', 12.5); doc.text('Resumo — o que pode e o que não pode', ML, y + 4.5); y += 8;
    for (const [rot, cor, itens] of [['PODE / DIREITO DO COLABORADOR', OK, m.pode], ['NÃO PODE / É PROIBIDO', BAD, m.naoPode]] as const) {
      need(12); font('helvetica', 'bold', 8.5, cor); doc.text(rot, ML, y + 3); y += 5;
      if (!itens.length) { font('helvetica', 'italic', 9.3, MUTED); doc.text('Nenhum item nesta seleção.', ML + 4, y + 3); y += 6; continue; }
      for (const it of itens) {
        font('helvetica', 'normal', 9.3); const ls = doc.splitTextToSize(`${plano(it.partes)} (${ordinal(it.numero)})`, W - 5) as string[];
        need(ls.length * lh(9.3) * 1.3 + 1); doc.setFillColor(...cor); doc.circle(ML + 1.3, y + 2.6, 0.9, 'F');
        for (const l of ls) { y += lh(9.3); doc.text(l, ML + 4.5, y); y += lh(9.3) * 0.3; } y += 1.6;
      }
      y += 2;
    }
    y += 2;
  }
  // Capítulos
  for (const c of m.capitulos) {
    y += 3; need(26); font('helvetica', 'bold', 8.5, GOLD); doc.setCharSpace(0.5); doc.text(`CAPÍTULO ${c.numero}`, ML, y + 3); doc.setCharSpace(0); y += 5;
    font('times', 'bold', 11.5); for (const l of doc.splitTextToSize(c.titulo.toUpperCase(), W) as string[]) { y += lh(11.5); doc.text(l, ML, y); y += 1; }
    y += 1; doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(ML, y, PW - MR, y); y += 3;
    for (const a of c.artigos) { font('times', 'normal', 10); justificado(`${ordinal(a.numero)}. ${plano(a.partes)}`, 10); y += 3.4; }
  }
  // Fechamento + assinatura sempre juntos
  font('times', 'normal', 10); const fl = (doc.splitTextToSize(mod.fechamento, W) as string[]).length;
  y += 4; need(fl * lh(10) * 1.2 + 8 + 38);
  justificado(mod.fechamento, 10); if (cd) { y += 2; doc.text(`${cd}.`, ML, y + lh(10)); y += lh(10) + 2; }
  y += 24; doc.setDrawColor(...INK); doc.setLineWidth(0.3); doc.line(PW / 2 - 40, y, PW / 2 + 40, y); y += 5;
  font('times', 'bold', 9.5); doc.text(`${emp}${e.cnpj.trim() ? ` — CNPJ: ${e.cnpj.trim()}` : ''}`, PW / 2, y, { align: 'center' }); y += 4.5;
  font('times', 'normal', 9); doc.text(`${e.representante.trim() || 'Representante'} — Representante Legal`, PW / 2, y, { align: 'center' });
  return doc;
}
