import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ChatFolder, ChatMessage, Conversation } from '../types/chat';
import { createId } from '../utils/format';

interface ChatState {
  conversations: Conversation[];
  folders: ChatFolder[];
  activeConversationId: string | null;
  createConversation: (modelId?: string, folderId?: string) => string;
  /** Open a blank chat (reuse empty thread if one exists). Like ChatGPT “New chat”. */
  startNewChat: (modelId?: string) => string;
  setActive: (id: string | null) => void;
  setConversationModel: (id: string, modelId: string) => void;
  renameConversation: (id: string, title: string) => void;
  togglePin: (id: string) => void;
  toggleFavorite: (id: string) => void;
  moveToFolder: (id: string, folderId?: string) => void;
  createFolder: (name: string) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  deleteConversation: (id: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  toggleMessageFavorite: (conversationId: string, messageId: string) => void;
  truncateAfter: (conversationId: string, messageId: string) => void;
  appendMessage: (
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'createdAt'> & { id?: string },
  ) => string;
  updateMessage: (
    conversationId: string,
    messageId: string,
    patch: Partial<ChatMessage>,
  ) => void;
  search: (query: string) => Conversation[];
  searchInConversation: (conversationId: string, query: string) => ChatMessage[];
}

function emptyConversation(modelId?: string, folderId?: string): Conversation {
  const now = Date.now();
  return {
    id: createId(),
    title: 'New chat',
    folderId,
    pinned: false,
    favorite: false,
    createdAt: now,
    updatedAt: now,
    messages: [],
    modelId,
  };
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      folders: [],
      activeConversationId: null,
      createConversation: (modelId, folderId) => {
        const conversation = emptyConversation(modelId, folderId);
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: conversation.id,
        }));
        return conversation.id;
      },
      startNewChat: (modelId) => {
        const state = get();
        const active = state.conversations.find((c) => c.id === state.activeConversationId);
        if (active && active.messages.length === 0) {
          if (modelId && active.modelId !== modelId) {
            get().setConversationModel(active.id, modelId);
          }
          return active.id;
        }
        const empty = state.conversations.find((c) => c.messages.length === 0);
        if (empty) {
          set({ activeConversationId: empty.id });
          if (modelId && empty.modelId !== modelId) {
            get().setConversationModel(empty.id, modelId);
          }
          return empty.id;
        }
        return get().createConversation(modelId);
      },
      setActive: (id) => set({ activeConversationId: id }),
      setConversationModel: (id, modelId) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, modelId, updatedAt: Date.now() } : c,
          ),
        })),
      renameConversation: (id, title) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c,
          ),
        })),
      togglePin: (id) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, pinned: !c.pinned, updatedAt: Date.now() } : c,
          ),
        })),
      toggleFavorite: (id) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id
              ? { ...c, favorite: !c.favorite, updatedAt: Date.now() }
              : c,
          ),
        })),
      moveToFolder: (id, folderId) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, folderId, updatedAt: Date.now() } : c,
          ),
        })),
      createFolder: (name) => {
        const folder: ChatFolder = {
          id: createId(),
          name: name.trim() || 'Folder',
          createdAt: Date.now(),
        };
        set((state) => ({ folders: [...state.folders, folder] }));
        return folder.id;
      },
      renameFolder: (id, name) =>
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        })),
      deleteFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          conversations: state.conversations.map((c) =>
            c.folderId === id ? { ...c, folderId: undefined } : c,
          ),
        })),
      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId:
            state.activeConversationId === id ? null : state.activeConversationId,
        })),
      deleteMessage: (conversationId, messageId) =>
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              updatedAt: Date.now(),
              messages: c.messages.filter((m) => m.id !== messageId),
            };
          }),
        })),
      toggleMessageFavorite: (conversationId, messageId) =>
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, favorite: !m.favorite } : m,
              ),
            };
          }),
        })),
      truncateAfter: (conversationId, messageId) =>
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const index = c.messages.findIndex((m) => m.id === messageId);
            if (index < 0) return c;
            return {
              ...c,
              updatedAt: Date.now(),
              messages: c.messages.slice(0, index + 1),
            };
          }),
        })),
      appendMessage: (conversationId, message) => {
        const id = message.id ?? createId();
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const nextMessages = [
              ...c.messages,
              { ...message, id, createdAt: Date.now() } as ChatMessage,
            ];
            const title =
              c.messages.length === 0 && message.role === 'user'
                ? message.content.slice(0, 42) || c.title
                : c.title;
            return { ...c, title, messages: nextMessages, updatedAt: Date.now() };
          }),
        }));
        return id;
      },
      updateMessage: (conversationId, messageId, patch) =>
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              updatedAt: Date.now(),
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, ...patch } : m,
              ),
            };
          }),
        })),
      search: (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return get().conversations;
        return get().conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.messages.some((m) => m.content.toLowerCase().includes(q)),
        );
      },
      searchInConversation: (conversationId, query) => {
        const q = query.trim().toLowerCase();
        const c = get().conversations.find((x) => x.id === conversationId);
        if (!c || !q) return c?.messages ?? [];
        return c.messages.filter((m) => m.content.toLowerCase().includes(q));
      },
    }),
    {
      name: '@pocketbrain/chats',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
