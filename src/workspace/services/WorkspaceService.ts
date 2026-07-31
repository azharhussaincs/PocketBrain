import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import type {
  AIEditAction,
  CreateDocumentInput,
  ExportFormat,
  WorkspaceDocType,
  WorkspaceDocument,
  WorkspaceSearchQuery,
  WorkspaceTemplate,
} from '../types/document';
import { documentGenerator } from '../generators/DocumentGenerator';
import { presentationGenerator } from '../generators/PresentationGenerator';
import { spreadsheetGenerator } from '../generators/SpreadsheetGenerator';
import { pdfGenerator } from '../generators/PDFGenerator';
import { exportService } from '../exporters/ExportService';
import { storageService } from '../storage/StorageService';
import { aiEditService } from './AIEditService';
import { getTemplateById, templatesByCategory, WORKSPACE_TEMPLATES } from '../templates/catalog';
import { createBlock, emptyBody } from '../utils/blocks';

export class WorkspaceService {
  readonly storage = storageService;
  readonly exporter = exportService;

  listTemplates(category?: string): WorkspaceTemplate[] {
    return templatesByCategory(category);
  }

  getTemplate(id: string) {
    return getTemplateById(id);
  }

  search(query: WorkspaceSearchQuery) {
    return storageService.search(query);
  }

  async createBlank(input: CreateDocumentInput): Promise<WorkspaceDocument> {
    return storageService.createDocument({
      ...input,
      body: input.body ?? emptyBody(input.type),
    });
  }

  async createFromTemplate(templateId: string, title?: string): Promise<WorkspaceDocument> {
    const template = getTemplateById(templateId);
    if (!template) throw new Error('Template not found');
    return storageService.createDocument({
      title: title?.trim() || template.name,
      type: template.type,
      templateId: template.id,
      body: structuredClone(template.body),
      tags: [template.category],
    });
  }

  async createWithAI(options: {
    prompt: string;
    type?: WorkspaceDocType;
    templateId?: string;
    modelId?: string;
    onToken?: (token: string) => void;
    signal?: AbortSignal;
  }): Promise<WorkspaceDocument> {
    const type = options.type ?? this.getTemplate(options.templateId ?? '')?.type ?? 'document';

    if (type === 'presentation') {
      const generated = await presentationGenerator.generate(options);
      return storageService.createDocument({
        title: generated.title,
        type: 'presentation',
        body: generated.body,
        modelId: generated.modelId,
        templateId: options.templateId,
        tags: ['ai-generated', 'presentation'],
      });
    }

    if (type === 'spreadsheet' || type === 'csv') {
      const generated = await spreadsheetGenerator.generate(options);
      return storageService.createDocument({
        title: generated.title,
        type,
        body: generated.body,
        modelId: generated.modelId,
        templateId: options.templateId,
        tags: ['ai-generated', 'spreadsheet'],
      });
    }

    if (type === 'pdf') {
      const generated = await pdfGenerator.generate(options);
      return storageService.createDocument({
        title: generated.title,
        type: 'pdf',
        body: generated.body,
        modelId: generated.modelId,
        templateId: options.templateId,
        tags: ['ai-generated', 'pdf'],
      });
    }

    const generated = await documentGenerator.generate({
      ...options,
      type,
    });
    return storageService.createDocument({
      title: generated.title,
      type: generated.type,
      body: generated.body,
      modelId: generated.modelId,
      templateId: options.templateId,
      tags: ['ai-generated'],
    });
  }

  async save(
    doc: WorkspaceDocument,
    options?: { createVersion?: boolean; versionLabel?: string },
  ) {
    storageService.clearRecovery(doc.id);
    return storageService.saveDocument(doc, options);
  }

  autosaveRecovery(doc: WorkspaceDocument) {
    storageService.writeRecovery(doc);
  }

  async export(doc: WorkspaceDocument, format: ExportFormat) {
    return exportService.exportAndShare(doc, format);
  }

  async aiEdit(options: {
    action: AIEditAction;
    text: string;
    modelId?: string;
    signal?: AbortSignal;
  }) {
    return aiEditService.edit(options);
  }

  async importTextFile(): Promise<WorkspaceDocument | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'text/plain',
        'text/markdown',
        'text/html',
        'application/json',
        'text/csv',
        'image/svg+xml',
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0];
    const file = new File(asset.uri);
    const text = await file.text();
    const name = asset.name || 'Imported';
    const lower = name.toLowerCase();

    let type: WorkspaceDocType = 'document';
    let body = emptyBody('document');

    if (lower.endsWith('.md')) {
      type = 'markdown';
      body = { blocks: text.split(/\n/).map((line) => createBlock('paragraph', line)) };
    } else if (lower.endsWith('.html') || lower.endsWith('.htm')) {
      type = 'html';
      body = { blocks: [createBlock('heading1', name)], htmlBody: text };
    } else if (lower.endsWith('.json')) {
      type = 'json';
      body = { blocks: [createBlock('code', text, { language: 'json' })] };
    } else if (lower.endsWith('.csv')) {
      type = 'csv';
      const lines = text.trim().split(/\r?\n/);
      const columns = (lines[0] ?? 'A,B,C').split(',');
      const rows = lines.slice(1).map((line) =>
        line.split(',').map((value) => ({ value: value.replace(/^"|"$/g, '') })),
      );
      body = {
        blocks: [createBlock('heading1', name)],
        spreadsheet: { sheetName: 'Imported', columns, rows },
      };
    } else if (lower.endsWith('.svg')) {
      type = 'svg';
      body = { blocks: [createBlock('heading1', name)], svgMarkup: text };
    } else {
      body = { blocks: text.split(/\n/).map((line) => createBlock('paragraph', line)) };
    }

    return storageService.createDocument({
      title: name.replace(/\.[^.]+$/, ''),
      type,
      body,
      tags: ['imported'],
    });
  }

  defaultExportFormats(type: WorkspaceDocType): ExportFormat[] {
    switch (type) {
      case 'presentation':
        return ['pptx', 'pdf', 'markdown', 'json'];
      case 'spreadsheet':
      case 'csv':
        return ['xlsx', 'csv', 'pdf', 'json'];
      case 'pdf':
        return ['pdf', 'docx', 'markdown', 'html'];
      case 'svg':
        return ['svg', 'html', 'pdf', 'txt'];
      case 'html':
        return ['html', 'pdf', 'markdown', 'txt'];
      case 'markdown':
        return ['markdown', 'docx', 'pdf', 'html', 'txt'];
      case 'json':
        return ['json', 'txt'];
      case 'code':
        return ['txt', 'markdown', 'html'];
      case 'mermaid':
        return ['markdown', 'svg', 'txt', 'json'];
      default:
        return ['docx', 'pdf', 'markdown', 'html', 'txt', 'json'];
    }
  }

  allTemplates() {
    return WORKSPACE_TEMPLATES;
  }
}

export const workspaceService = new WorkspaceService();
