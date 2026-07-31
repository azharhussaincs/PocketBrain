import { EncodingType, File, Paths } from 'expo-file-system';
import { createId } from '../../utils/format';
import type {
  CreateDocumentInput,
  DocumentVersion,
  WorkspaceDocument,
  WorkspaceDocumentMeta,
  WorkspaceFolder,
  WorkspaceIndex,
  WorkspaceSearchQuery,
} from '../types/document';
import { documentPlainText, emptyBody } from '../utils/blocks';
import {
  documentFile,
  ensureRecoveryDir,
  exportFile,
  getBackupsDir,
  getWorkspaceRoot,
  indexFile,
  recoveryFile,
  versionFile,
} from './paths';

function now() {
  return Date.now();
}

function emptyIndex(): WorkspaceIndex {
  return { version: 1, folders: [], documents: [], updatedAt: now() };
}

function readJsonFile<T>(file: File): T | null {
  if (!file.exists) return null;
  try {
    return JSON.parse(file.textSync()) as T;
  } catch {
    return null;
  }
}

function writeJsonFile(file: File, value: unknown): void {
  const payload = JSON.stringify(value);
  if (!file.exists) {
    file.create({ intermediates: true, overwrite: true });
  }
  file.write(payload);
}

export class StorageService {
  private indexCache: WorkspaceIndex | null = null;
  private listeners = new Set<(index: WorkspaceIndex) => void>();

  subscribe(listener: (index: WorkspaceIndex) => void): () => void {
    this.listeners.add(listener);
    listener(this.readIndex());
    return () => this.listeners.delete(listener);
  }

  private emit() {
    const index = this.readIndex();
    for (const listener of this.listeners) listener(index);
  }

  readIndex(): WorkspaceIndex {
    if (this.indexCache) return this.indexCache;
    getWorkspaceRoot();
    const parsed = readJsonFile<WorkspaceIndex>(indexFile());
    this.indexCache = parsed ?? emptyIndex();
    if (!parsed) writeJsonFile(indexFile(), this.indexCache);
    return this.indexCache;
  }

  private persistIndex(index: WorkspaceIndex) {
    this.indexCache = { ...index, updatedAt: now() };
    writeJsonFile(indexFile(), this.indexCache);
    this.emit();
  }

  listMeta(): WorkspaceDocumentMeta[] {
    return this.readIndex().documents;
  }

  listFolders(): WorkspaceFolder[] {
    return this.readIndex().folders;
  }

  getDocument(id: string): WorkspaceDocument | null {
    return readJsonFile<WorkspaceDocument>(documentFile(id));
  }

  async createDocument(input: CreateDocumentInput): Promise<WorkspaceDocument> {
    const timestamp = now();
    const doc: WorkspaceDocument = {
      id: createId(),
      title: input.title.trim() || 'Untitled',
      type: input.type,
      folderId: input.folderId ?? null,
      pinned: false,
      favorite: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastOpenedAt: timestamp,
      sizeBytes: 0,
      templateId: input.templateId,
      tags: input.tags ?? [],
      modelId: input.modelId,
      body: input.body ?? emptyBody(input.type),
      versions: [],
    };
    doc.sizeBytes = JSON.stringify(doc).length;
    writeJsonFile(documentFile(doc.id), doc);

    const index = this.readIndex();
    const { body: _b, versions: _v, ...meta } = doc;
    this.persistIndex({
      ...index,
      documents: [meta, ...index.documents],
    });
    return doc;
  }

  async saveDocument(
    doc: WorkspaceDocument,
    options?: { createVersion?: boolean; versionLabel?: string },
  ): Promise<WorkspaceDocument> {
    const previous = this.getDocument(doc.id);
    let versions = previous?.versions ?? doc.versions ?? [];

    if (options?.createVersion && previous) {
      const version = await this.snapshotVersion(
        previous,
        options.versionLabel ?? `Autosave ${new Date().toLocaleString()}`,
      );
      versions = [version, ...versions].slice(0, 50);
    }

    const next: WorkspaceDocument = {
      ...doc,
      updatedAt: now(),
      versions,
      sizeBytes: 0,
    };
    next.sizeBytes = JSON.stringify(next).length;
    writeJsonFile(documentFile(next.id), next);

    const index = this.readIndex();
    const { body: _b, versions: _v, ...meta } = next;
    this.persistIndex({
      ...index,
      documents: index.documents.map((d) => (d.id === next.id ? meta : d)),
    });
    return next;
  }

  async touchOpened(id: string): Promise<void> {
    const doc = this.getDocument(id);
    if (!doc) return;
    doc.lastOpenedAt = now();
    await this.saveDocument(doc);
  }

  async renameDocument(id: string, title: string): Promise<WorkspaceDocument | null> {
    const doc = this.getDocument(id);
    if (!doc) return null;
    doc.title = title.trim() || doc.title;
    return this.saveDocument(doc);
  }

  async duplicateDocument(id: string): Promise<WorkspaceDocument | null> {
    const doc = this.getDocument(id);
    if (!doc) return null;
    return this.createDocument({
      title: `${doc.title} (Copy)`,
      type: doc.type,
      folderId: doc.folderId,
      body: structuredClone(doc.body),
      tags: [...doc.tags],
      modelId: doc.modelId,
      templateId: doc.templateId,
    });
  }

  async deleteDocument(id: string): Promise<void> {
    const file = documentFile(id);
    if (file.exists) file.delete();
    const recovery = recoveryFile(id);
    if (recovery.exists) recovery.delete();
    const index = this.readIndex();
    this.persistIndex({
      ...index,
      documents: index.documents.filter((d) => d.id !== id),
    });
  }

  async moveDocument(id: string, folderId: string | null): Promise<void> {
    const doc = this.getDocument(id);
    if (!doc) return;
    doc.folderId = folderId;
    await this.saveDocument(doc);
  }

  async setFlags(
    id: string,
    flags: Partial<Pick<WorkspaceDocumentMeta, 'pinned' | 'favorite'>>,
  ): Promise<void> {
    const doc = this.getDocument(id);
    if (!doc) return;
    Object.assign(doc, flags);
    await this.saveDocument(doc);
  }

  async createFolder(name: string, parentId: string | null = null): Promise<WorkspaceFolder> {
    const folder: WorkspaceFolder = {
      id: createId(),
      name: name.trim() || 'New Folder',
      parentId,
      createdAt: now(),
      updatedAt: now(),
    };
    const index = this.readIndex();
    this.persistIndex({ ...index, folders: [...index.folders, folder] });
    return folder;
  }

  async renameFolder(id: string, name: string): Promise<void> {
    const index = this.readIndex();
    this.persistIndex({
      ...index,
      folders: index.folders.map((f) =>
        f.id === id ? { ...f, name: name.trim() || f.name, updatedAt: now() } : f,
      ),
    });
  }

  async deleteFolder(id: string): Promise<void> {
    const index = this.readIndex();
    const docs = await Promise.all(
      index.documents.filter((d) => d.folderId === id).map((d) => this.getDocument(d.id)),
    );
    for (const doc of docs) {
      if (doc) {
        doc.folderId = null;
        await this.saveDocument(doc);
      }
    }
    const latest = this.readIndex();
    this.persistIndex({
      ...latest,
      folders: latest.folders.filter((f) => f.id !== id && f.parentId !== id),
    });
  }

  search(query: WorkspaceSearchQuery): WorkspaceDocumentMeta[] {
    const {
      text = '',
      type = 'all',
      folderId,
      favorite,
      pinned,
      recentDays,
      sortBy = 'updatedAt',
      sortDir = 'desc',
    } = query;

    const q = text.trim().toLowerCase();
    const cutoff = recentDays ? now() - recentDays * 86_400_000 : 0;

    let results = this.listMeta().filter((doc) => {
      if (type !== 'all' && doc.type !== type) return false;
      if (folderId !== undefined && doc.folderId !== folderId) return false;
      if (favorite != null && doc.favorite !== favorite) return false;
      if (pinned != null && doc.pinned !== pinned) return false;
      if (cutoff && doc.lastOpenedAt < cutoff && doc.updatedAt < cutoff) return false;
      if (!q) return true;

      if (doc.title.toLowerCase().includes(q) || doc.tags.some((t) => t.includes(q))) {
        return true;
      }
      const full = this.getDocument(doc.id);
      if (!full) return false;
      return documentPlainText(full.body).toLowerCase().includes(q);
    });

    results = results.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });

    return results;
  }

  totalStorageBytes(): number {
    return this.listMeta().reduce((sum, d) => sum + (d.sizeBytes || 0), 0);
  }

  freeDiskBytes(): number | null {
    try {
      return Paths.availableDiskSpace;
    } catch {
      return null;
    }
  }

  writeRecovery(doc: WorkspaceDocument): void {
    ensureRecoveryDir();
    writeJsonFile(recoveryFile(doc.id), doc);
  }

  readRecovery(id: string): WorkspaceDocument | null {
    return readJsonFile<WorkspaceDocument>(recoveryFile(id));
  }

  clearRecovery(id: string): void {
    const file = recoveryFile(id);
    if (file.exists) file.delete();
  }

  async snapshotVersion(doc: WorkspaceDocument, label: string): Promise<DocumentVersion> {
    const id = createId();
    const snapshotPath = versionFile(doc.id, id).uri;
    const payload = {
      id: doc.id,
      title: doc.title,
      type: doc.type,
      body: doc.body,
      capturedAt: now(),
    };
    writeJsonFile(versionFile(doc.id, id), payload);
    return {
      id,
      createdAt: now(),
      label,
      sizeBytes: JSON.stringify(payload).length,
      snapshotPath,
    };
  }

  restoreVersion(documentId: string, versionId: string): WorkspaceDocument | null {
    const snapshot = readJsonFile<{ body: WorkspaceDocument['body']; title: string }>(
      versionFile(documentId, versionId),
    );
    const current = this.getDocument(documentId);
    if (!snapshot || !current) return null;
    current.body = snapshot.body;
    current.title = snapshot.title || current.title;
    writeJsonFile(documentFile(documentId), current);
    return current;
  }

  async writeBinaryExport(fileName: string, bytes: Uint8Array): Promise<File> {
    const file = exportFile(fileName);
    if (file.exists) file.delete();
    file.create({ intermediates: true });
    file.write(bytes);
    return file;
  }

  async writeBase64Export(fileName: string, base64: string): Promise<File> {
    const file = exportFile(fileName);
    if (file.exists) file.delete();
    file.create({ intermediates: true });
    file.write(base64, { encoding: EncodingType.Base64 });
    return file;
  }

  async writeTextExport(fileName: string, contents: string): Promise<File> {
    const file = exportFile(fileName);
    if (file.exists) file.delete();
    file.create({ intermediates: true });
    file.write(contents);
    return file;
  }

  async createBackupArchive(): Promise<File> {
    const index = this.readIndex();
    const docs = index.documents
      .map((m) => this.getDocument(m.id))
      .filter((d): d is WorkspaceDocument => d != null);
    const payload = {
      createdAt: now(),
      index,
      documents: docs,
    };
    const file = new File(getBackupsDir(), `backup-${now()}.json`);
    writeJsonFile(file, payload);
    return file;
  }
}

export const storageService = new StorageService();
