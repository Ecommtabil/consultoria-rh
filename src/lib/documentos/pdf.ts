import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { plano, type Documento } from './blocos';
const PET: [number, number, number] = [15, 76, 92], MOS: [number, number, number] = [201, 162, 39], CIN: [number, number, number] = [107, 114, 128], TXT: [number, number, number] = [17, 24, 39];
const L = 20, W = 170, TOP = 24, BOT = 274;
export function gerarPdf(d: Documento): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }); let y = TOP;
  const need = (h: number) => { if (y + h > BOT) { doc.addPage(); y = TOP; } };
  const lh = (s: number) => s * 0.48;
  const linhas = (t: string, s: number, st: string, w = W) => { doc.setFont('times', st); doc.setFontSize(s); return doc.splitTextToSize(plano(t), w) as string[]; };
  const escrever = (ls: string[], s: number, x: number, center = false) => { for (const l of ls) { need(lh(s)); doc.text(l, center ? 105 : x, y + lh(s) * 0.78, center ? { align: 'center' } : undefined); y += lh(s); } };
  if (d.capa) { const c = d.capa; doc.setTextColor(...CIN); doc.setFont('times', 'bold'); doc.setFontSize(12); doc.text(plano(c.empresa).toUpperCase(), 105, 95, { align: 'center' });
    doc.setTextColor(...PET); doc.setFontSize(26); doc.text(doc.splitTextToSize(c.titulo, W) as string[], 105, 112, { align: 'center' });
    doc.setTextColor(...TXT); doc.setFont('times', 'italic'); doc.setFontSize(13); doc.text(doc.splitTextToSize(c.subtitulo, 150) as string[], 105, 126, { align: 'center' });
    doc.setDrawColor(...MOS); doc.setLineWidth(0.8); doc.line(80, 136, 130, 136);
    doc.setFont('times', 'normal'); doc.setFontSize(10.5); doc.text(plano(c.versao), 105, 200, { align: 'center' }); doc.text(plano(c.aprovado), 105, 207, { align: 'center' });
    doc.addPage(); }
  doc.setTextColor(...TXT);
  for (const b of d.blocos) {
    if (b.t === 'title') { need(20); doc.setTextColor(...PET); escrever(linhas(b.text, 16, 'bold'), 16, L, true); doc.setTextColor(...TXT); y += 6; }
    else if (b.t === 'h1' || b.t === 'h2') { const s = b.t === 'h1' ? 14 : 12; const ls = linhas(b.text, s, 'bold'); y += b.t === 'h1' ? 5 : 2; need(ls.length * lh(s) + 18); doc.setTextColor(...PET); escrever(ls, s, L); doc.setTextColor(...TXT); y += 2; }
    else if (b.t === 'p') { escrever(linhas(b.text, 11, 'normal'), 11, L); y += 2.5; }
    else if (b.t === 'li') { const ls = linhas(b.text, 11, 'normal', W - 6); need(lh(11)); doc.text('•', L + 1.5, y + lh(11) * 0.78); escrever(ls, 11, L + 6); y += 1.2; }
    else if (b.t === 'note') { const ls = linhas(b.text, 10, 'italic', W - 10); const h = ls.length * lh(10) + 5; need(h + 2); y += 1; doc.setFillColor(251, 246, 230); doc.rect(L, y, W, h, 'F'); doc.setFillColor(...MOS); doc.rect(L, y, 1.4, h, 'F'); doc.setTextColor(...CIN); y += 2.5; for (const l of ls) { doc.text(l, L + 6, y + lh(10) * 0.78); y += lh(10); } y += 5; doc.setTextColor(...TXT); }
    else if (b.t === 'table') { need(22); autoTable(doc, { startY: y, margin: { left: L, right: 20, top: TOP, bottom: 300 - BOT }, head: [b.head], body: b.rows.map(r => r.map(plano)), styles: { font: 'times', fontSize: 10, textColor: TXT, cellPadding: 2 }, headStyles: { fillColor: PET, textColor: 255, fontStyle: 'bold' }, alternateRowStyles: { fillColor: [238, 244, 245] }, rowPageBreak: 'avoid' }); y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5; }
    else if (b.t === 'fields') { y += 2; for (const [l, v] of b.items) { need(11); doc.setFont('times', 'bold'); doc.setFontSize(11); doc.text(`${l}:`, L, y + 7); const x = L + doc.getTextWidth(`${l}: `) + 1; doc.setFont('times', 'normal'); doc.text(plano(v), x, y + 7); doc.setDrawColor(...CIN); doc.setLineWidth(0.2); doc.line(x, y + 8, L + W, y + 8); y += 11; } y += 4; }
    else if (b.t === 'sign') { need(34); y += 24; doc.setDrawColor(...TXT); doc.setLineWidth(0.3); doc.line(60, y, 150, y); doc.setFont('times', 'normal'); doc.setFontSize(10); doc.text(b.label, 105, y + 5, { align: 'center' }); y += 10; }
    else if (b.t === 'break') { doc.addPage(); y = TOP; }
  }
  const n = doc.getNumberOfPages();
  for (let i = d.capa ? 2 : 1; i <= n; i++) { doc.setPage(i); doc.setFont('times', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...CIN); doc.text(d.cabecalho, L, 13); doc.setDrawColor(209, 213, 219); doc.setLineWidth(0.2); doc.line(L, 15, L + W, 15); doc.text(`Página ${i}`, 105, 288, { align: 'center' }); }
  return doc;
}
