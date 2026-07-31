import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { createId } from '../utils/format';

export type GeneratedKind =
  | 'chat_export'
  | 'ai_output'
  | 'ocr'
  | 'code'
  | 'image_job'
  | 'document'
  | 'audio'
  | 'other';

export interface GeneratedItem {
  id: string;
  title: string;
  kind: GeneratedKind;
  mimeHint: string;
  content?: string;
  filePath?: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
  source?: string;
  conversationId?: string;
  workspaceDocumentId?: string;
}

const KEY = '@pocketbrain/generated_content_v1';

function outputsDir(): Directory {
  const dir = new Directory(Paths.document, 'ai-outputs');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

class GeneratedContentStore {
  private items: GeneratedItem[] = [];
  private ready: Promise<void>;
  private listeners = new Set<() => void>();

  constructor() {
    this.ready = this.hydrate();
  }

  private async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) this.items = JSON.parse(raw) as GeneratedItem[];
    } catch {
      this.items = [];
    }
  }

  private async persist() {
    await AsyncStorage.setItem(KEY, JSON.stringify(this.items));
    this.emit();
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    void this.ready.then(listener);
    return () => this.listeners.delete(listener);
  }

  async whenReady() {
    await this.ready;
  }

  list(): GeneratedItem[] {
    return [...this.items].sort((a, b) => b.updatedAt - a.updatedAt);
  }

  get(id: string): GeneratedItem | undefined {
    return this.items.find((i) => i.id === id);
  }

  async saveText(options: {
    title: string;
    content: string;
    kind?: GeneratedKind;
    source?: string;
    conversationId?: string;
    workspaceDocumentId?: string;
    favorite?: boolean;
  }): Promise<GeneratedItem> {
    await this.ready;
    const id = createId();
    const fileName = `${id}.txt`;
    const file = new File(outputsDir(), fileName);
    file.write(options.content);
    const now = Date.now();
    const item: GeneratedItem = {
      id,
      title: options.title.slice(0, 80) || 'AI output',
      kind: options.kind ?? 'ai_output',
      mimeHint: 'text/plain',
      content: options.content,
      filePath: file.uri,
      favorite: options.favorite ?? false,
      createdAt: now,
      updatedAt: now,
      source: options.source,
      conversationId: options.conversationId,
      workspaceDocumentId: options.workspaceDocumentId,
    };
    this.items.unshift(item);
    await this.persist();
    return item;
  }

  async rename(id: string, title: string) {
    await this.ready;
    this.items = this.items.map((i) =>
      i.id === id ? { ...i, title, updatedAt: Date.now() } : i,
    );
    await this.persist();
  }

  async setFavorite(id: string, favorite: boolean) {
    await this.ready;
    this.items = this.items.map((i) =>
      i.id === id ? { ...i, favorite, updatedAt: Date.now() } : i,
    );
    await this.persist();
  }

  async remove(id: string) {
    await this.ready;
    const item = this.items.find((i) => i.id === id);
    if (item?.filePath) {
      try {
        const file = new File(item.filePath);
        if (file.exists) file.delete();
      } catch {
        // ignore
      }
    }
    this.items = this.items.filter((i) => i.id !== id);
    await this.persist();
  }

  search(query: string): GeneratedItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.list();
    return this.list().filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.content ?? '').toLowerCase().includes(q) ||
        i.kind.includes(q),
    );
  }

  totalBytes(): number {
    return this.items.reduce((sum, i) => sum + (i.content?.length ?? 0), 0);
  }
}

export const generatedContentStore = new GeneratedContentStore();
