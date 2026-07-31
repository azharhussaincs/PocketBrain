import * as XLSX from 'xlsx';
import type { SpreadsheetData, WorkspaceDocument } from '../types/document';
import { spreadsheetToCsv } from '../utils/blocks';

function sheetFromDocument(doc: WorkspaceDocument): SpreadsheetData {
  if (doc.body.spreadsheet) return doc.body.spreadsheet;

  const rows = doc.body.blocks
    .filter((b) => b.type === 'table' && b.rows)
    .flatMap((b) => b.rows ?? []);

  if (rows.length) {
    const columns = rows[0].map((_, i) => `Col ${i + 1}`);
    return {
      sheetName: 'Sheet1',
      columns,
      rows: rows.map((row) =>
        row.map((cell) => ({
          value: cell.spans.map((s) => s.text).join(''),
        })),
      ),
    };
  }

  return {
    sheetName: 'Sheet1',
    columns: ['Content'],
    rows: doc.body.blocks.map((b) => [
      { value: (b.spans ?? []).map((s) => s.text).join('') },
    ]),
  };
}

export function exportXlsxBase64(doc: WorkspaceDocument): string {
  const sheet = sheetFromDocument(doc);
  const aoa: (string | number | boolean | null)[][] = [sheet.columns];
  for (const row of sheet.rows) {
    aoa.push(row.map((c) => (c.value == null ? '' : c.value)));
  }
  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName.slice(0, 31));
  return XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' }) as string;
}

export function exportCsvText(doc: WorkspaceDocument): string {
  return spreadsheetToCsv(sheetFromDocument(doc));
}
