import { AlignmentType, BorderStyle, Document, Footer, Header, Packer, PageBreak, PageNumber, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import { plano, type Bloco, type Documento } from './blocos';
let PET = '0F4C5C', MOS = 'C9A227', ZEB = 'EEF4F5', F = 'Georgia'; const CIN = '6B7280';
const r = (text: string, o: Record<string, unknown> = {}) => new TextRun({ text: plano(text), font: F, size: 22, ...o });
const cel = (t: string, fill: string, head = false) => new TableCell({ shading: { type: ShadingType.CLEAR, fill, color: 'auto' }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [r(t, head ? { bold: true, color: 'FFFFFF', size: 20 } : { size: 20 })] })] });
function bloco(b: Bloco): (Paragraph | Table)[] {
  switch (b.t) {
    case 'title': return [new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { after: 360 }, children: [r(b.text, { bold: true, size: 32, color: PET })] })];
    case 'h1': return [new Paragraph({ keepNext: true, keepLines: true, spacing: { before: 360, after: 160 }, children: [r(b.text, { bold: true, size: 28, color: PET })] })];
    case 'h2': return [new Paragraph({ keepNext: true, keepLines: true, spacing: { before: 200, after: 100 }, children: [r(b.text, { bold: true, size: 24, color: PET })] })];
    case 'p': return [new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 160, line: 300 }, children: [r(b.text)] })];
    case 'li': return [new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children: [r(b.text)] })];
    case 'note': return [new Paragraph({ shading: { type: ShadingType.CLEAR, fill: 'FBF6E6', color: 'auto' }, border: { left: { style: BorderStyle.SINGLE, size: 24, color: MOS, space: 8 } }, indent: { left: 160 }, spacing: { before: 120, after: 200 }, children: [r(b.text, { italics: true, color: CIN, size: 20 })] })];
    case 'table': return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ tableHeader: true, children: b.head.map(h => cel(h, PET, true)) }), ...b.rows.map((row, i) => new TableRow({ cantSplit: true, children: row.map(t => cel(t, i % 2 ? ZEB : 'FFFFFF')) }))] }), new Paragraph({ spacing: { after: 120 }, children: [] })];
    case 'fields': return b.items.map(([l, v]) => new Paragraph({ spacing: { before: 240, after: 60 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '9CA3AF', space: 2 } }, children: [r(`${l}: `, { bold: true }), r(v)] }));
    case 'sign': return [new Paragraph({ spacing: { before: 1000 }, alignment: AlignmentType.CENTER, children: [r('_______________________________________')] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [r(b.label, { size: 20 })] })];
    case 'break': return [new Paragraph({ children: [new PageBreak()] })];
  }
}
const A4 = { page: { size: { width: 11906, height: 16838 }, margin: { top: 1418, bottom: 1418, left: 1418, right: 1418 } } };
export async function gerarWord(d: Documento): Promise<Blob> {
  PET = d.tema?.cor ?? '0F4C5C'; F = d.tema?.fonte === 'sans' ? 'Calibri' : 'Georgia'; ZEB = d.tema ? 'F1F5F9' : 'EEF4F5'; MOS = d.tema ? 'D97706' : 'C9A227';
  const header = new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB', space: 4 } }, children: [r(d.cabecalho, { size: 16, color: CIN })] })] });
  const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ font: F, size: 16, color: CIN, children: ['Página ', PageNumber.CURRENT] })] })] });
  const sections = [];
  if (d.capa) { const c = d.capa; sections.push({ properties: A4, children: [
    new Paragraph({ spacing: { before: 3600 }, alignment: AlignmentType.CENTER, children: [r(c.empresa.toUpperCase(), { size: 24, color: CIN, bold: true })] }),
    new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [r(c.titulo, { size: 52, bold: true, color: PET })] }),
    new Paragraph({ spacing: { before: 200, after: 400 }, alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: MOS, space: 12 } }, children: [r(c.subtitulo, { size: 26, italics: true })] }),
    new Paragraph({ spacing: { before: 2400 }, alignment: AlignmentType.CENTER, children: [r(c.versao, { size: 20 })] }),
    new Paragraph({ spacing: { before: 120 }, alignment: AlignmentType.CENTER, children: [r(c.aprovado, { size: 20 })] }),
  ] }); }
  sections.push({ properties: A4, headers: { default: header }, footers: { default: footer }, children: d.blocos.flatMap(bloco) });
  return Packer.toBlob(new Document({ creator: 'Kit Governança Interna', title: d.titulo, sections }));
}
