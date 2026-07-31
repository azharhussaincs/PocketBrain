import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  Portal,
  Searchbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import { useAppStore } from '../../../store/appStore';
import { useChatStore } from '../../../store/chatStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { aiService } from '../../../services/AIService';
import { chatOrchestrator } from '../../../services/ChatOrchestrator';
import { getListingById } from '../../../data/catalog';
import { ModelRequiredGate } from '../../../components/ModelRequiredGate';
import { ResponseActions } from '../../../components/ResponseActions';
import { UniversalComposer } from '../../../components/UniversalComposer';
import { MarkdownText } from '../../../components/MarkdownText';
import { generatedContentStore } from '../../../files/GeneratedContentStore';
import type { ChatAttachment } from '../../../types/attachments';
import type { RootTabParamList } from '../../navigation/types';
import { formatBytes } from '../../../utils/format';

export function ChatScreen() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const route = useRoute<RouteProp<RootTabParamList, 'ChatTab'>>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const installed = useAppStore((s) => s.installed);
  const gpuEnabled = useSettingsStore((s) => s.gpuEnabled);
  const nCtx = useSettingsStore((s) => s.defaultContextSize);

  const conversations = useChatStore((s) => s.conversations);
  const folders = useChatStore((s) => s.folders);
  const activeId = useChatStore((s) => s.activeConversationId);
  const createConversation = useChatStore((s) => s.createConversation);
  const startNewChat = useChatStore((s) => s.startNewChat);
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
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [statusLabel, setStatusLabel] = useState<string | undefined>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modelMenu, setModelMenu] = useState(false);
  const [sending, setSending] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [threadSearch, setThreadSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const sendingLock = useRef(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    // Android 15+/API 36 edge-to-edge often ignores adjustResize — lift composer manually.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const readyModels = useMemo(
    () => installed.filter((m) => m.status === 'installed'),
    [installed],
  );

  // Home / task “Chat” opens a blank thread (like ChatGPT New chat).
  useFocusEffect(
    React.useCallback(() => {
      if (!route.params?.newChat) return;
      const modelId =
        chatOrchestrator.resolveInstalledModelId(
          useChatStore.getState().conversations.find(
            (c) => c.id === useChatStore.getState().activeConversationId,
          )?.modelId,
        ) ??
        readyModels[0]?.listingId;
      startNewChat(modelId);
      setDraft('');
      setAttachments([]);
      setShowSearch(false);
      setThreadSearch('');
      navigation.setParams({ newChat: false });
    }, [route.params?.newChat, readyModels, startNewChat, navigation]),
  );

  const active = conversations.find((c) => c.id === activeId) ?? null;

  // If the conversation's model was deleted, fall back to another installed model.
  const selectedModelId = useMemo(() => {
    const preferred = active?.modelId;
    if (preferred && readyModels.some((m) => m.listingId === preferred)) {
      return preferred;
    }
    return readyModels[0]?.listingId ?? '';
  }, [active?.modelId, readyModels]);

  useEffect(() => {
    if (!active || !selectedModelId) return;
    if (active.modelId === selectedModelId) return;
    setConversationModel(active.id, selectedModelId);
    setStatusLabel(`Switched to ${readyModels.find((m) => m.listingId === selectedModelId)?.localName ?? 'another model'}`);
    const t = setTimeout(() => setStatusLabel(undefined), 2500);
    return () => clearTimeout(t);
  }, [active, selectedModelId, readyModels, setConversationModel]);

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

  const goGet = (
    collection?: import('../../../discover/recommendations').MarketplaceCollectionId,
  ) =>
    navigation.navigate('MarketplaceTab', {
      screen: 'MarketplaceHome',
      params: collection ? { collection } : undefined,
    });

  const runGeneration = async (
    conversationId: string,
    prompt: string,
    modelId: string,
    messageAttachments: ChatAttachment[] = [],
    historyOverride?: import('../../../types/chat').ChatMessage[],
  ) => {
    if (sendingLock.current) return;
    sendingLock.current = true;

    const assistantId = appendMessage(conversationId, {
      role: 'assistant',
      content: '',
      streaming: true,
      modelId,
    });

    const controller = new AbortController();
    abortRef.current = controller;
    setSending(true);
    setStatusLabel('Starting…');

    const conversation = useChatStore
      .getState()
      .conversations.find((c) => c.id === conversationId);
    const history =
      historyOverride ??
      (conversation?.messages.filter((m) => m.id !== assistantId) ?? []);

    try {
      let assembled = '';
      const result = await chatOrchestrator.send({
        prompt,
        attachments: messageAttachments,
        history,
        modelId,
        gpuEnabled,
        nCtx,
        signal: controller.signal,
        onStatus: setStatusLabel,
        onToken: ({ token, done }) => {
          if (done) return;
          assembled += token;
          updateMessage(conversationId, assistantId, {
            content: assembled,
            streaming: true,
          });
        },
      });

      if (result.switchedToModelId) {
        setConversationModel(conversationId, result.switchedToModelId);
      }

      const finalText = (assembled || result.text || '').trim();
      updateMessage(conversationId, assistantId, {
        content: finalText || 'No response generated.',
        streaming: false,
        workspaceDocumentId: result.workspaceDocumentId,
      });

      if (result.needsModel) {
        Alert.alert('Model needed', result.needsModel.message, [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Download models',
            onPress: () => goGet(result.needsModel!.collection),
          },
        ]);
      }

      if (result.workspaceDocumentId) {
        Alert.alert('Document created', 'Open it in Workspace to preview, export, and share.', [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Open',
            onPress: () =>
              navigation.navigate('WorkspaceTab', {
                screen: 'DocumentEditor',
                params: { documentId: result.workspaceDocumentId! },
              }),
          },
        ]);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Generation failed.';
      updateMessage(conversationId, assistantId, {
        content: message,
        streaming: false,
      });
      Alert.alert('Generation failed', message, [
        { text: 'OK' },
        { text: 'Get models', onPress: () => goGet() },
      ]);
    } finally {
      setSending(false);
      setStatusLabel(undefined);
      abortRef.current = null;
      sendingLock.current = false;
    }
  };

  const onSend = async () => {
    if (sending || sendingLock.current) return;

    const content = draft.trim();
    const pendingAttachments = [...attachments];
    const blocked = chatOrchestrator.assertCanSend(
      content,
      pendingAttachments,
      selectedModelId || undefined,
    );
    if (blocked) {
      chatOrchestrator.explainBlocked(blocked, () => goGet());
      return;
    }

    const modelId =
      chatOrchestrator.resolveInstalledModelId(selectedModelId) ?? selectedModelId;
    if (active && modelId && modelId !== active.modelId) {
      setConversationModel(active.id, modelId);
    }

    const conversationId = ensureConversation(modelId);
    const userLabel =
      content ||
      (pendingAttachments.length
        ? `Attached: ${pendingAttachments.map((a) => a.name).join(', ')}`
        : '');

    setDraft('');
    setAttachments([]);
    appendMessage(conversationId, {
      role: 'user',
      content: userLabel,
      attachments: pendingAttachments,
    });
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    await runGeneration(conversationId, content, modelId, pendingAttachments);
  };

  const regenerate = async (assistantMessageId: string) => {
    if (!active || sending || !selectedModelId) return;
    const index = active.messages.findIndex((m) => m.id === assistantMessageId);
    if (index < 0) return;
    let userPrompt = '';
    let userAttachments: ChatAttachment[] = [];
    for (let i = index - 1; i >= 0; i -= 1) {
      if (active.messages[i].role === 'user') {
        userPrompt = active.messages[i].content;
        userAttachments = active.messages[i].attachments ?? [];
        break;
      }
    }
    if (!userPrompt && !userAttachments.length) return;
    deleteMessage(active.id, assistantMessageId);
    const history = active.messages.filter((m) => m.id !== assistantMessageId).slice(0, index);
    await runGeneration(
      active.id,
      userPrompt,
      selectedModelId,
      userAttachments,
      history,
    );
  };

  const continueGeneration = async () => {
    if (!active || sending || !selectedModelId) {
      if (!selectedModelId) {
        chatOrchestrator.explainBlocked(
          'No text model is installed. Download a Text model from Get to continue.',
          () => goGet(),
        );
      }
      return;
    }
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

  const composerPad = keyboardHeight > 0 ? 8 : Math.max(insets.bottom > 0 ? 4 : 8, 8);
  const composerLift = keyboardHeight; // sits above keyboard; tab bar hides while keyboard is open

  return (
    <ModelRequiredGate capability="chat" title="Chat needs a text model">
      <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.container, styles.messagesPane]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text variant="headlineSmall">Chat</Text>
              <Text variant="bodySmall" style={styles.muted} numberOfLines={2}>
                {usingMock
                  ? 'Demo replies until a model is installed — download one from Get.'
                  : `On this phone · ${modelLabel}`}
                {stats ? ` · ${stats.total} msgs` : ''}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <IconButton
                icon="package-variant"
                onPress={() => setModelMenu(true)}
                accessibilityLabel="Switch model"
              />
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuOpen(true)}
                accessibilityLabel="Chat options"
              />
            </View>
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
              ref={listRef}
              style={styles.flex}
              data={visibleMessages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.messages,
                { paddingBottom: 88 + (keyboardHeight > 0 ? 12 : 0) },
              ]}
              initialNumToRender={12}
              windowSize={9}
              maxToRenderPerBatch={8}
              removeClippedSubviews
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onContentSizeChange={() => {
                if (sending || visibleMessages.length) {
                  listRef.current?.scrollToEnd({ animated: true });
                }
              }}
              ListEmptyComponent={null}
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
                  {item.attachments?.length ? (
                    <View style={styles.attachChips}>
                      {item.attachments.map((a: ChatAttachment) => (
                        <Text key={a.id} variant="labelSmall" style={styles.attachChip}>
                          {a.name} · {formatBytes(a.sizeBytes)}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  {item.role === 'assistant' && !item.streaming ? (
                    <MarkdownText content={item.content || '…'} />
                  ) : (
                    <Text selectable>{item.content || '…'}</Text>
                  )}
                  {item.role === 'assistant' && item.workspaceDocumentId && !item.streaming ? (
                    <Button
                      mode="outlined"
                      compact
                      style={{ marginTop: 8 }}
                      onPress={() =>
                        navigation.navigate('WorkspaceTab', {
                          screen: 'DocumentEditor',
                          params: { documentId: item.workspaceDocumentId! },
                        })
                      }
                    >
                      Open in Workspace
                    </Button>
                  ) : null}
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
          </View>

          <View
            style={[
              styles.composerDock,
              {
                bottom: composerLift,
                paddingBottom: composerPad,
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.outlineVariant ?? theme.colors.outline,
              },
            ]}
          >
            <UniversalComposer
              draft={draft}
              onChangeDraft={setDraft}
              attachments={attachments}
              onChangeAttachments={setAttachments}
              sending={sending}
              statusLabel={statusLabel}
              onSend={() => void onSend()}
              onStop={() => abortRef.current?.abort()}
              placeholder="Message…"
            />
            {sending ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
          </View>

          <Portal>
            <Dialog
              visible={menuOpen}
              onDismiss={() => setMenuOpen(false)}
              style={styles.optionsDialog}
            >
              <Dialog.Title>Chat options</Dialog.Title>
              <Dialog.ScrollArea style={styles.optionsScroll}>
                <List.Item
                  title="New chat"
                  left={(props) => <List.Icon {...props} icon="plus" />}
                  onPress={() => {
                    setMenuOpen(false);
                    startNewChat(selectedModelId);
                    setDraft('');
                    setAttachments([]);
                  }}
                />
                <List.Item
                  title="Search in chat"
                  left={(props) => <List.Icon {...props} icon="magnify" />}
                  onPress={() => {
                    setMenuOpen(false);
                    setShowSearch((v) => !v);
                  }}
                />
                {active ? (
                  <>
                    <List.Item
                      title="Rename"
                      left={(props) => <List.Icon {...props} icon="pencil-outline" />}
                      onPress={() => {
                        setMenuOpen(false);
                        setRenameValue(active.title);
                        setRenameOpen(true);
                      }}
                    />
                    <List.Item
                      title={active.pinned ? 'Unpin' : 'Pin'}
                      left={(props) => (
                        <List.Icon {...props} icon={active.pinned ? 'pin-off-outline' : 'pin-outline'} />
                      )}
                      onPress={() => {
                        setMenuOpen(false);
                        togglePin(active.id);
                      }}
                    />
                    <List.Item
                      title={active.favorite ? 'Unfavorite' : 'Favorite'}
                      left={(props) => (
                        <List.Icon {...props} icon={active.favorite ? 'star' : 'star-outline'} />
                      )}
                      onPress={() => {
                        setMenuOpen(false);
                        toggleFavorite(active.id);
                      }}
                    />
                    <List.Item
                      title="Move to new folder"
                      left={(props) => <List.Icon {...props} icon="folder-plus-outline" />}
                      onPress={() => {
                        setMenuOpen(false);
                        const name = `Folder ${folders.length + 1}`;
                        const folderId = createFolder(name);
                        moveToFolder(active.id, folderId);
                        Alert.alert('Moved', `Chat moved to ${name}.`);
                      }}
                    />
                    <List.Item
                      title="Conversation stats"
                      left={(props) => <List.Icon {...props} icon="chart-box-outline" />}
                      onPress={() => {
                        setMenuOpen(false);
                        if (!stats || !active) return;
                        Alert.alert(
                          'Conversation stats',
                          `Title: ${active.title}\nMessages: ${stats.total}\nYou: ${stats.userCount}\nAI: ${stats.assistantCount}\nCharacters: ${stats.chars}`,
                        );
                      }}
                    />
                    <List.Item
                      title="Export chat"
                      left={(props) => <List.Icon {...props} icon="export-variant" />}
                      onPress={() => {
                        setMenuOpen(false);
                        void exportChat();
                      }}
                    />
                    <List.Item
                      title="Delete chat"
                      titleStyle={{ color: theme.colors.error }}
                      left={(props) => (
                        <List.Icon {...props} icon="delete-outline" color={theme.colors.error} />
                      )}
                      onPress={() => {
                        setMenuOpen(false);
                        deleteConversation(active.id);
                      }}
                    />
                  </>
                ) : null}

                {conversations.length ? (
                  <>
                    <Divider style={styles.optionsDivider} />
                    <Text variant="labelLarge" style={styles.optionsSection}>
                      Recent chats
                    </Text>
                    {conversations.slice(0, 8).map((c) => (
                      <List.Item
                        key={c.id}
                        title={c.title}
                        description={c.id === activeId ? 'Current' : undefined}
                        left={(props) => (
                          <List.Icon
                            {...props}
                            icon={
                              c.pinned
                                ? 'pin'
                                : c.favorite
                                  ? 'star'
                                  : c.id === activeId
                                    ? 'chat'
                                    : 'chat-outline'
                            }
                          />
                        )}
                        onPress={() => {
                          setMenuOpen(false);
                          setActive(c.id);
                        }}
                      />
                    ))}
                  </>
                ) : null}
              </Dialog.ScrollArea>
              <Dialog.Actions>
                <Button onPress={() => setMenuOpen(false)}>Close</Button>
              </Dialog.Actions>
            </Dialog>

            <Dialog visible={modelMenu} onDismiss={() => setModelMenu(false)}>
              <Dialog.Title>Switch model</Dialog.Title>
              <Dialog.ScrollArea style={styles.optionsScroll}>
                {readyModels.length ? (
                  readyModels.map((m) => (
                    <List.Item
                      key={m.listingId}
                      title={m.localName}
                      left={(props) => <List.Icon {...props} icon="package-variant" />}
                      onPress={() => {
                        setModelMenu(false);
                        if (active) setConversationModel(active.id, m.listingId);
                        else createConversation(m.listingId);
                      }}
                    />
                  ))
                ) : (
                  <Text style={styles.optionsEmpty}>No installed models yet. Download one from Get.</Text>
                )}
              </Dialog.ScrollArea>
              <Dialog.Actions>
                <Button onPress={() => setModelMenu(false)}>Close</Button>
              </Dialog.Actions>
            </Dialog>

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
        </View>
    </ModelRequiredGate>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 8 },
  messagesPane: { flex: 1, minHeight: 0 },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerText: { flex: 1, minWidth: 0 },
  headerActions: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  muted: { opacity: 0.7 },
  search: { marginBottom: 8 },
  optionsDialog: { maxHeight: '85%' },
  optionsScroll: { maxHeight: 420, paddingHorizontal: 0 },
  optionsDivider: { marginVertical: 8 },
  optionsSection: { paddingHorizontal: 16, paddingVertical: 8, opacity: 0.7 },
  optionsEmpty: { paddingHorizontal: 24, paddingVertical: 16, opacity: 0.7 },
  messages: { paddingVertical: 12, paddingBottom: 24, flexGrow: 1 },
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
  attachChips: { gap: 4, marginBottom: 6 },
  attachChip: {
    opacity: 0.75,
    marginBottom: 2,
  },
  composerDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 20,
    elevation: 12,
  },
});
