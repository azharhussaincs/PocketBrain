import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  IconButton,
  Menu,
  Portal,
  Searchbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useAppStore } from '../../../store/appStore';
import { useChatStore } from '../../../store/chatStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { aiService } from '../../../services/AIService';
import { getListingById } from '../../../data/catalog';
import { ModelRequiredGate } from '../../../components/ModelRequiredGate';
import { ResponseActions } from '../../../components/ResponseActions';
import { MarkdownText } from '../../../components/MarkdownText';
import { EmptyState } from '../../../components/EmptyState';
import { generatedContentStore } from '../../../files/GeneratedContentStore';
import type { RootTabParamList } from '../../navigation/types';

export function ChatScreen() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const insets = useSafeAreaInsets();
  const installed = useAppStore((s) => s.installed);
  const gpuEnabled = useSettingsStore((s) => s.gpuEnabled);
  const nCtx = useSettingsStore((s) => s.defaultContextSize);

  const conversations = useChatStore((s) => s.conversations);
  const folders = useChatStore((s) => s.folders);
  const activeId = useChatStore((s) => s.activeConversationId);
  const createConversation = useChatStore((s) => s.createConversation);
  const setActive = useChatStore((s) => s.setActive);
  const setConversationModel = useChatStore((s) => s.setConversationModel);
  const renameConversation = useChatStore((s) => s.renameConversation);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const togglePin = useChatStore((s) => s.togglePin);
  const toggleFavorite = useChatStore((s) => s.toggleFavorite);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const toggleMessageFavorite = useChatStore((s) => s.toggleMessageFavorite);
  const truncateAfter = useChatStore((s) => s.truncateAfter);
  const createFolder = useChatStore((s) => s.createFolder);
  const moveToFolder = useChatStore((s) => s.moveToFolder);
  const searchInConversation = useChatStore((s) => s.searchInConversation);

  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [modelMenu, setModelMenu] = useState(false);
  const [sending, setSending] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [threadSearch, setThreadSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const readyModels = useMemo(
    () => installed.filter((m) => m.status === 'installed'),
    [installed],
  );

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const selectedModelId = active?.modelId ?? readyModels[0]?.listingId ?? '';
  const usingMock = aiService.isUsingMockRuntime() || !readyModels.length;
  const modelLabel =
    readyModels.find((m) => m.listingId === selectedModelId)?.localName ??
    getListingById(selectedModelId)?.name ??
    'No model';

  const stats = useMemo(() => {
    if (!active) return null;
    const userCount = active.messages.filter((m) => m.role === 'user').length;
    const assistantCount = active.messages.filter((m) => m.role === 'assistant').length;
    const chars = active.messages.reduce((sum, m) => sum + m.content.length, 0);
    return { userCount, assistantCount, chars, total: active.messages.length };
  }, [active]);

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const visibleMessages = useMemo(() => {
    if (!active) return [];
    if (!threadSearch.trim()) return active.messages;
    return searchInConversation(active.id, threadSearch);
  }, [active, threadSearch, searchInConversation]);

  const ensureConversation = (modelId: string) => {
    if (active) return active.id;
    return createConversation(modelId);
  };

  const runGeneration = async (
    conversationId: string,
    prompt: string,
    modelId: string,
  ) => {
    const assistantId = appendMessage(conversationId, {
      role: 'assistant',
      content: '',
      streaming: true,
      modelId,
    });

    const controller = new AbortController();
    abortRef.current = controller;
    setSending(true);

    try {
      let assembled = '';
      await aiService.generateText({
        modelId,
        prompt,
        gpuEnabled,
        nCtx,
        signal: controller.signal,
        onToken: ({ token, done }) => {
          if (done) return;
          assembled += token;
          updateMessage(conversationId, assistantId, {
            content: assembled,
            streaming: true,
          });
        },
      });
      updateMessage(conversationId, assistantId, {
        content: assembled || 'No response generated.',
        streaming: false,
      });
    } catch (error) {
      updateMessage(conversationId, assistantId, {
        content:
          error instanceof Error ? error.message : 'Generation failed.',
        streaming: false,
      });
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  };

  const onSend = async () => {
    const content = draft.trim();
    if (!content || sending || !selectedModelId) return;
    const conversationId = ensureConversation(selectedModelId);
    setDraft('');
    appendMessage(conversationId, { role: 'user', content });
    await runGeneration(conversationId, content, selectedModelId);
  };

  const regenerate = async (assistantMessageId: string) => {
    if (!active || sending || !selectedModelId) return;
    const index = active.messages.findIndex((m) => m.id === assistantMessageId);
    if (index < 0) return;
    let userPrompt = '';
    for (let i = index - 1; i >= 0; i -= 1) {
      if (active.messages[i].role === 'user') {
        userPrompt = active.messages[i].content;
        break;
      }
    }
    if (!userPrompt) return;
    deleteMessage(active.id, assistantMessageId);
    await runGeneration(active.id, userPrompt, selectedModelId);
  };

  const continueGeneration = async () => {
    if (!active || sending || !selectedModelId) return;
    const last = [...active.messages].reverse().find((m) => m.role === 'assistant');
    if (!last?.content) return;
    await runGeneration(
      active.id,
      `Continue the following response without repeating it:\n\n${last.content}`,
      selectedModelId,
    );
  };

  const editPrompt = (assistantMessageId: string) => {
    if (!active) return;
    const index = active.messages.findIndex((m) => m.id === assistantMessageId);
    if (index < 0) return;
    for (let i = index - 1; i >= 0; i -= 1) {
      if (active.messages[i].role === 'user') {
        setDraft(active.messages[i].content);
        truncateAfter(active.id, active.messages[i].id);
        return;
      }
    }
  };

  const exportChat = async () => {
    if (!active) return;
    const text = active.messages
      .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
      .join('\n\n');
    await generatedContentStore.saveText({
      title: active.title || 'Chat export',
      content: text,
      kind: 'chat_export',
      source: 'chat',
      conversationId: active.id,
    });
    Alert.alert('Exported', 'Chat saved to Files → Chat Exports.');
  };

  return (
    <ModelRequiredGate capability="chat" title="Chat needs a text model">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text variant="headlineSmall">Chat</Text>
              <Text variant="bodySmall" style={styles.muted}>
                {usingMock
                  ? 'Demo replies until a model is installed — download one from Models.'
                  : `On this phone · ${modelLabel}`}
                {stats
                  ? ` · ${stats.total} msgs`
                  : ''}
              </Text>
            </View>
            <Menu
              visible={modelMenu}
              onDismiss={() => setModelMenu(false)}
              anchor={
                <IconButton
                  icon="cube-outline"
                  onPress={() => setModelMenu(true)}
                  accessibilityLabel="Switch model"
                />
              }
            >
              {readyModels.map((m) => (
                <Menu.Item
                  key={m.listingId}
                  onPress={() => {
                    setModelMenu(false);
                    if (active) setConversationModel(active.id, m.listingId);
                    else createConversation(m.listingId);
                  }}
                  title={m.localName}
                />
              ))}
            </Menu>
            <Menu
              visible={menuOpen}
              onDismiss={() => setMenuOpen(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuOpen(true)}
                  accessibilityLabel="Chat options"
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuOpen(false);
                  createConversation(selectedModelId);
                }}
                title="New chat"
              />
              <Menu.Item
                onPress={() => {
                  setMenuOpen(false);
                  setShowSearch((v) => !v);
                }}
                title="Search in chat"
              />
              {active ? (
                <>
                  <Menu.Item
                    onPress={() => {
                      setMenuOpen(false);
                      setRenameValue(active.title);
                      setRenameOpen(true);
                    }}
                    title="Rename conversation"
                  />
                  <Menu.Item
                    onPress={() => {
                      setMenuOpen(false);
                      togglePin(active.id);
                    }}
                    title={active.pinned ? 'Unpin' : 'Pin'}
                  />
                  <Menu.Item
                    onPress={() => {
                      setMenuOpen(false);
                      toggleFavorite(active.id);
                    }}
                    title={active.favorite ? 'Unfavorite' : 'Favorite'}
                  />
                  <Menu.Item
                    onPress={() => {
                      setMenuOpen(false);
                      const name = `Folder ${folders.length + 1}`;
                      const folderId = createFolder(name);
                      moveToFolder(active.id, folderId);
                      Alert.alert('Moved', `Chat moved to ${name}.`);
                    }}
                    title="Move to new folder"
                  />
                  <Menu.Item
                    onPress={() => {
                      setMenuOpen(false);
                      if (!stats || !active) return;
                      Alert.alert(
                        'Conversation stats',
                        `Title: ${active.title}\nMessages: ${stats.total}\nYou: ${stats.userCount}\nAI: ${stats.assistantCount}\nCharacters: ${stats.chars}`,
                      );
                    }}
                    title="Conversation stats"
                  />
                  <Menu.Item
                    onPress={() => {
                      setMenuOpen(false);
                      void exportChat();
                    }}
                    title="Export chat"
                  />
                  <Menu.Item
                    onPress={() => {
                      setMenuOpen(false);
                      deleteConversation(active.id);
                    }}
                    title="Delete chat"
                  />
                </>
              ) : null}
              {conversations.slice(0, 8).map((c) => (
                <Menu.Item
                  key={c.id}
                  onPress={() => {
                    setMenuOpen(false);
                    setActive(c.id);
                  }}
                  title={`${c.pinned ? '📌 ' : ''}${c.favorite ? '★ ' : ''}${c.title}`}
                />
              ))}
            </Menu>
          </View>

          {showSearch ? (
            <Searchbar
              placeholder="Search within conversation"
              value={threadSearch}
              onChangeText={setThreadSearch}
              style={styles.search}
            />
          ) : null}

          <FlatList
            data={visibleMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messages}
            initialNumToRender={12}
            windowSize={9}
            maxToRenderPerBatch={8}
            removeClippedSubviews
            ListEmptyComponent={
              <EmptyState
                title="Ask anything privately"
                description="Messages stay on this phone. Try: “Summarize this idea in 3 bullets” or “Explain photosynthesis simply”."
                actionLabel={readyModels.length ? undefined : 'Download a model'}
                onAction={
                  readyModels.length
                    ? undefined
                    : () => navigation.navigate('MarketplaceTab')
                }
              />
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
                accessibilityLabel={`${item.role} message`}
              >
                <Text variant="labelSmall" style={styles.role}>
                  {item.role}
                  {item.streaming ? ' · streaming' : ''}
                  {item.favorite ? ' · ★' : ''}
                  {' · '}
                  {formatTime(item.createdAt)}
                </Text>
                {item.role === 'assistant' && !item.streaming ? (
                  <MarkdownText content={item.content || '…'} />
                ) : (
                  <Text selectable>{item.content || '…'}</Text>
                )}
                {item.role === 'assistant' && !item.streaming ? (
                  <ResponseActions
                    text={item.content}
                    title={active?.title ?? 'Chat reply'}
                    disabled={sending}
                    favorited={item.favorite}
                    onFavorite={() =>
                      active && toggleMessageFavorite(active.id, item.id)
                    }
                    onRegenerate={() => void regenerate(item.id)}
                    onContinue={() => void continueGeneration()}
                    onEditPrompt={() => editPrompt(item.id)}
                    onDelete={() => active && deleteMessage(active.id, item.id)}
                    onOpenInWorkspace={(documentId) =>
                      navigation.navigate('WorkspaceTab', {
                        screen: 'DocumentEditor',
                        params: { documentId },
                      })
                    }
                  />
                ) : null}
              </View>
            )}
          />

          <View style={styles.composer}>
            <TextInput
              mode="outlined"
              placeholder="Message PocketBrain"
              value={draft}
              onChangeText={setDraft}
              style={styles.input}
              multiline
              disabled={sending}
            />
            {sending ? (
              <Button
                mode="outlined"
                accessibilityLabel="Stop generation"
                onPress={() => abortRef.current?.abort()}
              >
                Stop
              </Button>
            ) : (
              <Button
                mode="contained"
                accessibilityLabel="Send message"
                onPress={() => void onSend()}
                disabled={!draft.trim()}
              >
                Send
              </Button>
            )}
          </View>
          {sending ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
        </View>

        <Portal>
          <Dialog visible={renameOpen} onDismiss={() => setRenameOpen(false)}>
            <Dialog.Title>Rename conversation</Dialog.Title>
            <Dialog.Content>
              <TextInput value={renameValue} onChangeText={setRenameValue} mode="outlined" />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setRenameOpen(false)}>Cancel</Button>
              <Button
                onPress={() => {
                  if (active) renameConversation(active.id, renameValue.trim() || 'Chat');
                  setRenameOpen(false);
                }}
              >
                Save
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </KeyboardAvoidingView>
    </ModelRequiredGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerText: { flex: 1 },
  muted: { opacity: 0.7 },
  search: { marginBottom: 8 },
  messages: { paddingVertical: 12, paddingBottom: 24 },
  empty: { marginTop: 48, gap: 8 },
  bubble: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    maxWidth: '96%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#CCFBF1',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2E8F0',
  },
  role: { opacity: 0.6, marginBottom: 4, textTransform: 'uppercase' },
  composer: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  input: { flex: 1, maxHeight: 120 },
});
