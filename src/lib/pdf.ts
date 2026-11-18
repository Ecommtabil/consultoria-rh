import jsPDF from 'jspdf';
import autoTable, { type UserOptions } from 'jspdf-autotable';
export const AZUL: [number, number, number] = [30, 58, 138];
export const AZUL2: [number, number, number] = [29, 78, 216];
export const ZEBRA: [number, number, number] = [241, 245, 249];
export const GELO: [number, number, number] = [239, 246, 255];
export const AMBAR: [number, number, number] = [217, 119, 6];
export const TEXTO: [number, number, number] = [15, 23, 42];
export const CINZA: [number, number, number] = [100, 116, 139];
export type Pdf = { doc: jsPDF; y: number };
/** Cabeçalho padrão: faixa azul com título, empresa e CNPJ. */
export function faixa(doc: jsPDF, titulo: string, empresa: { nome: string; cnpj?: string | null }, linhas: string[] = []) {
  const h = 22 + linhas.length * 4.2; doc.setFillColor(...AZUL); doc.rect(0, 0, 210, h, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.text(titulo, 14, 10);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(`${empresa.nome}${empresa.cnpj ? ` — CNPJ ${empresa.cnpj}` : ''}`, 14, 16);
  linhas.forEach((l, i) => doc.text(l, 14, 21 + i * 4.2)); doc.setTextColor(...TEXTO); return h + 8;
}
/** Cabeçalho padrão: faixa azul com título, empresa e CNPJ. */
export function novoPdf(titulo: string, empresa: { nome: string; cnpj?: string | null }, linhas: string[] = []): Pdf {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }); doc.setFont('helvetica', 'normal'); return { doc, y: faixa(doc, titulo, empresa, linhas) };
}
export function quebra(p: Pdf, alt: number) { if (p.y + alt > 280) { p.doc.addPage(); p.y = 16; } }
export function secao(p: Pdf, texto: string) { quebra(p, 14); p.doc.setFont('helvetica', 'bold'); p.doc.setFontSize(11.5); p.doc.setTextColor(...AZUL); p.doc.text(texto, 14, p.y); p.doc.setDrawColor(...AZUL2); p.doc.setLineWidth(0.4); p.doc.line(14, p.y + 1.6, 196, p.y + 1.6); p.y += 7; p.doc.setTextColor(...TEXTO); p.doc.setFont('helvetica', 'normal'); }
export function paragrafo(p: Pdf, texto: string, tam = 9.5) { p.doc.setFontSize(tam); const ls = p.doc.splitTextToSize(texto, 182) as string[]; for (const l of ls) { quebra(p, 5); p.doc.text(l, 14, p.y); p.y += tam * 0.45; } p.y += 2; }
export function cartoes(p: Pdf, itens: [string, string][]) {
  quebra(p, 22); const w = (182 - (itens.length - 1) * 3) / itens.length;
  itens.forEach(([l, v], i) => { const x = 14 + i * (w + 3); p.doc.setFillColor(...GELO); p.doc.setDrawColor(219, 234, 254); p.doc.roundedRect(x, p.y, w, 18, 2, 2, 'FD'); p.doc.setFontSize(7.5); p.doc.setTextColor(...CINZA); p.doc.text(l, x + 3, p.y + 5.5); p.doc.setFont('helvetica', 'bold'); p.doc.setFontSize(13); p.doc.setTextColor(...AZUL); p.doc.text(v, x + 3, p.y + 13.5); p.doc.setFont('helvetica', 'normal'); });
  p.doc.setTextColor(...TEXTO); p.y += 24;
}
export function tabela(p: Pdf, opts: UserOptions) {
  autoTable(p.doc, { startY: p.y, margin: { left: 14, right: 14 }, styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.6, textColor: TEXTO }, headStyles: { fillColor: AZUL, textColor: 255, fontStyle: 'bold' }, alternateRowStyles: { fillColor: ZEBRA }, ...opts });
  p.y = ((p.doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY) + 6;
}
export function assinaturas(p: Pdf, nomes: string[]) {
  quebra(p, 30); p.y += 14; const w = (182 - 10 * (nomes.length - 1)) / nomes.length;
  nomes.forEach((n, i) => { const x = 14 + i * (w + 10); p.doc.setDrawColor(...CINZA); p.doc.line(x, p.y, x + w, p.y); p.doc.setFontSize(8.5); p.doc.text(n, x, p.y + 4.5); p.doc.text('Data: ____/____/______', x, p.y + 9); });
  p.y += 16;
}
/** Rodapé padrão “Página X de Y” em todas as páginas. */
export function finalizar(p: Pdf, arquivo: string) {
  const n = p.doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) { p.doc.setPage(i); p.doc.setFontSize(7.5); p.doc.setTextColor(...CINZA); p.doc.setDrawColor(203, 213, 225); p.doc.line(14, 287, 196, 287); p.doc.text('Kit Governança Interna', 14, 291); p.doc.text(`Página ${i} de ${n}`, 196, 291, { align: 'right' }); }
  p.doc.save(arquivo);
}
