import { Directory, File, Paths } from 'expo-file-system';
import { generatedContentStore, type GeneratedItem } from './GeneratedContentStore';
import { storageService as workspaceStorage } from '../workspace/storage/StorageService';
import { getWorkspaceRoot } from '../workspace/storage/paths';
import { modelManager } from '../services/ModelManager';

export type FileCategory =
  | 'all'
  | 'images'
  | 'videos'
  | 'audio'
  | 'documents'
  | 'code'
  | 'pdf'
  | 'powerpoint'
  | 'word'
  | 'excel'
  | 'ocr'
  | 'chat_exports'
  | 'ai_outputs';

export interface ExplorerEntry {
  id: string;
  title: string;
  category: FileCategory;
  path?: string;
  sizeBytes: number;
  updatedAt: number;
  favorite?: boolean;
  kind: 'workspace' | 'generated' | 'export' | 'model' | 'image_job';
  workspaceDocumentId?: string;
  generatedId?: string;
  mimeHint?: string;
}

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function categoryFromName(name: string): FileCategory {
  const ext = extOf(name);
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return 'images';
  if (['mp4', 'webm', 'mov', 'mkv'].includes(ext)) return 'videos';
  if (['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
  if (['js', 'ts', 'tsx', 'py', 'java', 'kt', 'c', 'cpp', 'rs', 'go', 'json'].includes(ext)) {
    return 'code';
  }
  if (['md', 'txt', 'html'].includes(ext)) return 'documents';
  return 'documents';
}

function listFiles(dir: Directory, out: File[] = []): File[] {
  if (!dir.exists) return out;
  try {
    for (const child of dir.list()) {
      if (child instanceof Directory) listFiles(child, out);
      else if (child instanceof File) out.push(child);
    }
  } catch {
    // ignore
  }
  return out;
}

function generatedCategory(item: GeneratedItem): FileCategory {
  if (item.kind === 'ocr') return 'ocr';
  if (item.kind === 'chat_export') return 'chat_exports';
  if (item.kind === 'code') return 'code';
  if (item.kind === 'image_job') return 'images';
  return 'ai_outputs';
}

export class FileExplorerService {
  list(options?: {
    category?: FileCategory;
    query?: string;
    sort?: 'recent' | 'name' | 'size';
  }): ExplorerEntry[] {
    const category = options?.category ?? 'all';
    const query = (options?.query ?? '').trim().toLowerCase();
    const entries: ExplorerEntry[] = [];

    for (const meta of workspaceStorage.listMeta()) {
      entries.push({
        id: `ws-${meta.id}`,
        title: meta.title,
        category:
          meta.type === 'spreadsheet'
            ? 'excel'
            : meta.type === 'presentation'
              ? 'powerpoint'
              : meta.type === 'code'
                ? 'code'
                : 'documents',
        sizeBytes: 0,
        updatedAt: meta.updatedAt,
        favorite: meta.favorite,
        kind: 'workspace',
        workspaceDocumentId: meta.id,
      });
    }

    for (const item of generatedContentStore.list()) {
      entries.push({
        id: `gen-${item.id}`,
        title: item.title,
        category: generatedCategory(item),
        path: item.filePath,
        sizeBytes: item.content?.length ?? 0,
        updatedAt: item.updatedAt,
        favorite: item.favorite,
        kind: 'generated',
        generatedId: item.id,
        mimeHint: item.mimeHint,
      });
    }

    try {
      const exportsDir = new Directory(getWorkspaceRoot(), 'exports');
      for (const file of listFiles(exportsDir)) {
        entries.push({
          id: `export-${file.uri}`,
          title: file.name,
          category: categoryFromName(file.name),
          path: file.uri,
          sizeBytes: file.size || 0,
          updatedAt: Date.now(),
          kind: 'export',
          mimeHint: extOf(file.name),
        });
      }
    } catch {
      // ignore
    }

    try {
      const genImages = new Directory(Paths.document, 'generated-images');
      for (const file of listFiles(genImages)) {
        entries.push({
          id: `imgjob-${file.uri}`,
          title: file.name,
          category: 'images',
          path: file.uri,
          sizeBytes: file.size || 0,
          updatedAt: Date.now(),
          kind: 'image_job',
        });
      }
    } catch {
      // ignore
    }

    for (const model of modelManager.list().filter((m) => m.status === 'installed')) {
      entries.push({
        id: `model-${model.listingId}`,
        title: model.localName,
        category: 'all',
        path: model.filePath,
        sizeBytes: model.sizeBytes,
        updatedAt: model.lastUsedAt ?? model.installedAt,
        favorite: model.favorite,
        kind: 'model',
      });
    }

    let filtered = entries;
    if (category !== 'all') {
      filtered = filtered.filter((e) => e.category === category);
    }
    if (query) {
      filtered = filtered.filter((e) => e.title.toLowerCase().includes(query));
    }

    const sort = options?.sort ?? 'recent';
    filtered.sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title);
      if (sort === 'size') return b.sizeBytes - a.sizeBytes;
      return b.updatedAt - a.updatedAt;
    });

    return filtered;
  }
}

export const fileExplorerService = new FileExplorerService();

export const FILE_CATEGORIES: Array<{ id: FileCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'ai_outputs', label: 'AI Outputs' },
  { id: 'documents', label: 'Documents' },
  { id: 'code', label: 'Code' },
  { id: 'pdf', label: 'PDF' },
  { id: 'word', label: 'Word' },
  { id: 'excel', label: 'Excel' },
  { id: 'powerpoint', label: 'PowerPoint' },
  { id: 'images', label: 'Images' },
  { id: 'ocr', label: 'OCR' },
  { id: 'chat_exports', label: 'Chat Exports' },
  { id: 'audio', label: 'Audio' },
  { id: 'videos', label: 'Videos' },
];
