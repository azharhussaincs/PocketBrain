import { modelRegistry } from '../ai/registry/ModelRegistry';
import { useChatStore } from '../store/chatStore';
import { workspaceService } from '../workspace/services/WorkspaceService';
import { AI_TASKS } from '../discover/tasks';
import { toFriendlyCard } from '../discover/recommendations';
import { generatedContentStore } from '../files/GeneratedContentStore';

export type SearchResultKind = 'document' | 'chat' | 'model' | 'task' | 'file';

export interface SearchResult {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  routeHint:
    | { type: 'document'; documentId: string }
    | { type: 'chat' }
    | { type: 'model'; modelId: string }
    | { type: 'task'; taskId: string }
    | { type: 'playground'; mode?: string }
    | { type: 'files' };
}

export function globalSearch(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];

  for (const task of AI_TASKS) {
    if (
      task.title.toLowerCase().includes(q) ||
      task.subtitle.toLowerCase().includes(q) ||
      task.benefit.toLowerCase().includes(q)
    ) {
      results.push({
        id: `task-${task.id}`,
        kind: 'task',
        title: task.title,
        subtitle: task.subtitle,
        routeHint: { type: 'task', taskId: task.id },
      });
    }
  }

  for (const meta of workspaceService.search({ text: q })) {
    results.push({
      id: `doc-${meta.id}`,
      kind: 'document',
      title: meta.title,
      subtitle: `${meta.type} · updated ${new Date(meta.updatedAt).toLocaleDateString()}`,
      routeHint: { type: 'document', documentId: meta.id },
    });
  }

  for (const item of generatedContentStore.search(q).slice(0, 15)) {
    results.push({
      id: `gen-${item.id}`,
      kind: 'file',
      title: item.title,
      subtitle: `${item.kind} · AI output`,
      routeHint: { type: 'files' },
    });
  }

  const chats = useChatStore.getState().search(q).slice(0, 20);
  for (const chat of chats) {
    results.push({
      id: `chat-${chat.id}`,
      kind: 'chat',
      title: chat.title,
      subtitle: 'Chat history (on device)',
      routeHint: { type: 'chat' },
    });
  }

  for (const model of modelRegistry.listAll()) {
    const card = toFriendlyCard(model.id);
    const hay = `${model.name} ${model.description} ${model.author} ${card?.friendlyName ?? ''}`.toLowerCase();
    if (hay.includes(q)) {
      results.push({
        id: `model-${model.id}`,
        kind: 'model',
        title: card?.friendlyName ?? model.name,
        subtitle: model.installed ? 'Installed' : 'Available to download',
        routeHint: { type: 'model', modelId: model.id },
      });
    }
  }

  return results.slice(0, 50);
}
