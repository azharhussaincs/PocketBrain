import type { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { ExportFormat, WorkspaceDocument } from '../types/document';
import { storageService } from '../storage/StorageService';
import { exportDocxBase64 } from './docxExporter';
import { exportPdfBase64 } from './pdfExporter';
import { exportPptxBase64 } from './pptxExporter';
import { exportCsvText, exportXlsxBase64 } from './xlsxExporter';
import {
  exportHtml,
  exportJson,
  exportMarkdown,
  exportSvg,
  exportTxt,
} from './textExporters';

function safeName(title: string): string {
  return title.replace(/[^\w\-]+/g, '_').slice(0, 64) || 'document';
}

export class ExportService {
  async export(
    doc: WorkspaceDocument,
    format: ExportFormat,
  ): Promise<{ file: File; format: ExportFormat }> {
    const base = safeName(doc.title);
    const stamp = Date.now();

    switch (format) {
      case 'docx': {
        const b64 = await exportDocxBase64(doc);
        const file = await storageService.writeBase64Export(`${base}-${stamp}.docx`, b64);
        return { file, format };
      }
      case 'pdf': {
        const b64 = await exportPdfBase64(doc);
        const file = await storageService.writeBase64Export(`${base}-${stamp}.pdf`, b64);
        return { file, format };
      }
      case 'pptx': {
        const b64 = await exportPptxBase64(doc);
        const file = await storageService.writeBase64Export(`${base}-${stamp}.pptx`, b64);
        return { file, format };
      }
      case 'xlsx': {
        const b64 = exportXlsxBase64(doc);
        const file = await storageService.writeBase64Export(`${base}-${stamp}.xlsx`, b64);
        return { file, format };
      }
      case 'csv': {
        const file = await storageService.writeTextExport(
          `${base}-${stamp}.csv`,
          exportCsvText(doc),
        );
        return { file, format };
      }
      case 'markdown': {
        const file = await storageService.writeTextExport(
          `${base}-${stamp}.md`,
          exportMarkdown(doc),
        );
        return { file, format };
      }
      case 'html': {
        const file = await storageService.writeTextExport(
          `${base}-${stamp}.html`,
          exportHtml(doc),
        );
        return { file, format };
      }
      case 'txt': {
        const file = await storageService.writeTextExport(
          `${base}-${stamp}.txt`,
          exportTxt(doc),
        );
        return { file, format };
      }
      case 'json': {
        const file = await storageService.writeTextExport(
          `${base}-${stamp}.json`,
          exportJson(doc),
        );
        return { file, format };
      }
      case 'svg': {
        const file = await storageService.writeTextExport(
          `${base}-${stamp}.svg`,
          exportSvg(doc),
        );
        return { file, format };
      }
      default: {
        const _exhaustive: never = format;
        throw new Error(`Unsupported export format: ${_exhaustive}`);
      }
    }
  }

  async exportAndShare(doc: WorkspaceDocument, format: ExportFormat): Promise<File> {
    const { file } = await this.export(doc, format);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        dialogTitle: `Share ${doc.title}`,
        mimeType: mimeFor(format),
        UTI: utiFor(format),
      });
    } else {
      throw new Error(
        'Sharing is unavailable on this device. The export file was still created and saved in Files.',
      );
    }
    return file;
  }
}

function mimeFor(format: ExportFormat): string {
  switch (format) {
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'pdf':
      return 'application/pdf';
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'csv':
      return 'text/csv';
    case 'markdown':
      return 'text/markdown';
    case 'html':
      return 'text/html';
    case 'json':
      return 'application/json';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'text/plain';
  }
}

function utiFor(format: ExportFormat): string | undefined {
  switch (format) {
    case 'docx':
      return 'org.openxmlformats.wordprocessingml.document';
    case 'pdf':
      return 'com.adobe.pdf';
    case 'pptx':
      return 'org.openxmlformats.presentationml.presentation';
    case 'xlsx':
      return 'org.openxmlformats.spreadsheetml.sheet';
    default:
      return undefined;
  }
}

export const exportService = new ExportService();
