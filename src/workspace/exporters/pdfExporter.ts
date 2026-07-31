import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';
import type { ContentBlock, WorkspaceDocument } from '../types/document';
import { plainFromSpans } from '../utils/blocks';
import { bytesToBase64 } from '../utils/bytes';

const MARGIN = 54;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

export async function exportPdfBytes(doc: WorkspaceDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  let pageNumber = 1;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 28) {
      drawFooter(page, pageNumber, regular);
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageNumber += 1;
      y = PAGE_HEIGHT - MARGIN;
      drawHeader(page, doc.title, regular);
      y -= 28;
    }
  };

  drawHeader(page, doc.title, regular);
  y -= 36;

  page.drawText(doc.title, {
    x: MARGIN,
    y,
    size: 18,
    font: bold,
    color: rgb(0.06, 0.46, 0.43),
  });
  y -= 28;

  for (const block of doc.body.blocks) {
    y = drawBlock(page, block, y, regular, bold, mono, ensureSpace, () => {
      drawFooter(page, pageNumber, regular);
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageNumber += 1;
      y = PAGE_HEIGHT - MARGIN;
      drawHeader(page, doc.title, regular);
      y -= 28;
      return page;
    });
  }

  // Redraw footers for all pages with final count
  const pages = pdf.getPages();
  pages.forEach((p, idx) => drawFooter(p, idx + 1, regular, pages.length));

  return pdf.save();
}

export async function exportPdfBase64(doc: WorkspaceDocument): Promise<string> {
  const bytes = await exportPdfBytes(doc);
  return bytesToBase64(bytes);
}

function drawHeader(page: PDFPage, title: string, font: PDFFont) {
  page.drawText(title.slice(0, 64), {
    x: MARGIN,
    y: PAGE_HEIGHT - 36,
    size: 9,
    font,
    color: rgb(0.4, 0.45, 0.5),
  });
  page.drawLine({
    start: { x: MARGIN, y: PAGE_HEIGHT - 42 },
    end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 42 },
    thickness: 0.5,
    color: rgb(0.8, 0.84, 0.88),
  });
}

function drawFooter(page: PDFPage, pageNumber: number, font: PDFFont, total?: number) {
  const label = total ? `Page ${pageNumber} of ${total}` : `Page ${pageNumber}`;
  page.drawLine({
    start: { x: MARGIN, y: 36 },
    end: { x: PAGE_WIDTH - MARGIN, y: 36 },
    thickness: 0.5,
    color: rgb(0.8, 0.84, 0.88),
  });
  page.drawText(label, {
    x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(label, 9),
    y: 22,
    size: 9,
    font,
    color: rgb(0.4, 0.45, 0.5),
  });
  page.drawText('PocketBrain · Offline', {
    x: MARGIN,
    y: 22,
    size: 9,
    font,
    color: rgb(0.4, 0.45, 0.5),
  });
}

function drawBlock(
  page: PDFPage,
  block: ContentBlock,
  y: number,
  regular: PDFFont,
  bold: PDFFont,
  mono: PDFFont,
  ensureSpace: (needed: number) => void,
  newPage: () => PDFPage,
): number {
  let currentPage = page;
  let cursor = y;
  const text = plainFromSpans(block.spans);

  if (block.type === 'divider') {
    ensureSpace(16);
    currentPage.drawLine({
      start: { x: MARGIN, y: cursor },
      end: { x: PAGE_WIDTH - MARGIN, y: cursor },
      thickness: 1,
      color: rgb(0.8, 0.84, 0.88),
    });
    return cursor - 16;
  }

  if (block.type === 'table' && block.rows) {
    for (const row of block.rows) {
      const line = row.map((c) => plainFromSpans(c.spans)).join('  |  ');
      const lines = wrapText(line, regular, 10, CONTENT_WIDTH);
      for (const l of lines) {
        ensureSpace(14);
        currentPage.drawText(l, { x: MARGIN, y: cursor, size: 10, font: regular });
        cursor -= 14;
      }
    }
    return cursor - 8;
  }

  let size = 11;
  let font = regular;
  let prefix = '';
  if (block.type === 'heading1') {
    size = 16;
    font = bold;
  } else if (block.type === 'heading2') {
    size = 14;
    font = bold;
  } else if (block.type === 'heading3') {
    size = 12;
    font = bold;
  } else if (block.type === 'code') {
    font = mono;
    size = 10;
  } else if (block.type === 'bullet') {
    prefix = '• ';
  } else if (block.type === 'numbered') {
    prefix = '1. ';
  } else if (block.type === 'checkbox') {
    prefix = block.checked ? '[x] ' : '[ ] ';
  }

  const content = `${prefix}${text || block.raw || ''}`;
  const lines = wrapText(content, font, size, CONTENT_WIDTH);
  for (const line of lines) {
    if (cursor - (size + 4) < MARGIN + 28) {
      currentPage = newPage();
      cursor = PAGE_HEIGHT - MARGIN - 28;
    }
    currentPage.drawText(line, {
      x: MARGIN,
      y: cursor,
      size,
      font,
      color: rgb(0.06, 0.09, 0.16),
    });
    cursor -= size + 4;
  }
  return cursor - 6;
}
