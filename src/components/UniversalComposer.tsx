import React, { useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  IconButton,
  Menu,
  Text,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ChatAttachment } from '../types/attachments';
import { attachmentService } from '../services/AttachmentService';
import {
  speechToTextService,
  useSpeechRecognitionEvent,
} from '../ai/speech/SpeechToTextService';
import { permissionService } from '../permissions/PermissionService';
import { formatBytes } from '../utils/format';

interface Props {
  draft: string;
  onChangeDraft: (value: string) => void;
  attachments: ChatAttachment[];
  onChangeAttachments: (next: ChatAttachment[]) => void;
  sending: boolean;
  onSend: () => void;
  onStop: () => void;
  placeholder?: string;
  statusLabel?: string;
}

function iconForKind(kind: ChatAttachment['kind']): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (kind) {
    case 'image':
      return 'image-outline';
    case 'audio':
      return 'microphone-outline';
    case 'video':
      return 'video-outline';
    case 'pdf':
      return 'file-pdf-box';
    case 'spreadsheet':
      return 'file-excel-outline';
    case 'presentation':
      return 'file-powerpoint-outline';
    case 'code':
      return 'code-tags';
    default:
      return 'file-document-outline';
  }
}

/**
 * Responsive chat composer — one aligned row: attach · input · send.
 * Extra tools live in the + menu so the bar never wraps under the send button.
 */
export function UniversalComposer({
  draft,
  onChangeDraft,
  attachments,
  onChangeAttachments,
  sending,
  onSend,
  onStop,
  placeholder = 'Message…',
  statusLabel,
}: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript?.trim();
    if (!transcript) return;
    const current = draftRef.current.trim();
    onChangeDraft(current ? `${current} ${transcript}` : transcript);
  });
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    Alert.alert(
      'Speech recognition',
      event.message || 'Could not transcribe. Check microphone permission.',
    );
  });

  const canSend =
    !sending &&
    !busy &&
    (Boolean(draft.trim()) ||
      attachments.some((a) => a.status === 'ready' || a.status === 'unsupported'));

  const toggleMic = async () => {
    setMenuOpen(false);
    try {
      if (listening) {
        speechToTextService.stop();
        setListening(false);
        return;
      }
      if (!speechToTextService.isAvailable()) {
        Alert.alert(
          'Speech not available',
          'Speech recognition needs a native build. Type your message, or open Home → Voice.',
        );
        return;
      }
      const perm = await permissionService.ensure(
        'speech',
        'PocketBrain uses the microphone only while you dictate. Audio stays on-device when possible.',
      );
      if (!perm.granted) return;
      await speechToTextService.start({ interimResults: false, continuous: false });
      setListening(true);
    } catch (error) {
      setListening(false);
      Alert.alert(
        'Microphone unavailable',
        error instanceof Error ? error.message : 'Could not start speech recognition.',
      );
    }
  };

  const addAttachments = async (items: ChatAttachment[]) => {
    if (!items.length) return;
    onChangeAttachments([...attachments, ...items].slice(0, attachmentService.maxAttachments));
  };

  const pickFiles = async () => {
    setMenuOpen(false);
    try {
      setBusy(true);
      await addAttachments(await attachmentService.pickDocuments(attachments.length));
    } catch (error) {
      Alert.alert(
        'Could not attach file',
        error instanceof Error ? error.message : 'File picker failed.',
      );
    } finally {
      setBusy(false);
    }
  };

  const pickGallery = async () => {
    setMenuOpen(false);
    try {
      setBusy(true);
      await addAttachments(await attachmentService.pickImagesFromGallery(attachments.length));
    } catch (error) {
      Alert.alert(
        'Could not open gallery',
        error instanceof Error ? error.message : 'Gallery picker failed.',
      );
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    setMenuOpen(false);
    try {
      setBusy(true);
      const item = await attachmentService.takePhoto(attachments.length);
      if (item) await addAttachments([item]);
    } catch (error) {
      Alert.alert(
        'Camera unavailable',
        error instanceof Error ? error.message : 'Could not capture photo.',
      );
    } finally {
      setBusy(false);
    }
  };

  const removeAttachment = (id: string) => {
    const target = attachments.find((a) => a.id === id);
    onChangeAttachments(attachments.filter((a) => a.id !== id));
    if (target) void attachmentService.removeFromDisk(target);
  };

  const previewAttachment = (item: ChatAttachment) => {
    const lines = [
      `Name: ${item.name}`,
      `Type: ${item.kind}`,
      `Size: ${formatBytes(item.sizeBytes)}`,
      `Status: ${item.status}`,
    ];
    if (item.errorMessage) lines.push(`Note: ${item.errorMessage}`);
    if (item.textExcerpt) lines.push('', 'Preview:', item.textExcerpt.slice(0, 800));
    Alert.alert(item.name, lines.join('\n'));
  };

  return (
    <View style={styles.root}>
      {attachments.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.attachList}
          contentContainerStyle={styles.attachListContent}
          keyboardShouldPersistTaps="handled"
        >
          {attachments.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => previewAttachment(item)}
              style={[
                styles.attachChip,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.outlineVariant ?? theme.colors.outline,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Attachment ${item.name}`}
            >
              <MaterialCommunityIcons
                name={iconForKind(item.kind)}
                size={18}
                color={theme.colors.primary}
              />
              <Text variant="labelMedium" numberOfLines={1} style={styles.attachName}>
                {item.name}
              </Text>
              <IconButton
                icon="close"
                size={14}
                style={styles.attachClose}
                onPress={() => removeAttachment(item.id)}
                accessibilityLabel={`Remove ${item.name}`}
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {statusLabel ? (
        <Text variant="labelSmall" style={[styles.status, { color: theme.colors.primary }]} numberOfLines={1}>
          {statusLabel}
        </Text>
      ) : null}

      <View style={styles.composer}>
        <Menu
          visible={menuOpen}
          onDismiss={() => setMenuOpen(false)}
          anchor={
            <IconButton
              icon="plus"
              mode="contained-tonal"
              size={compact ? 20 : 22}
              disabled={sending || busy || attachments.length >= attachmentService.maxAttachments}
              onPress={() => setMenuOpen(true)}
              accessibilityLabel="Add attachment"
              style={styles.sideBtn}
            />
          }
        >
          <Menu.Item onPress={() => void pickFiles()} title="Files" leadingIcon="file-outline" />
          <Menu.Item
            onPress={() => void pickGallery()}
            title="Gallery"
            leadingIcon="image-multiple-outline"
          />
          <Menu.Item onPress={() => void takePhoto()} title="Camera" leadingIcon="camera-outline" />
          <Menu.Item
            onPress={() => void toggleMic()}
            title={listening ? 'Stop dictation' : 'Dictate'}
            leadingIcon="microphone-outline"
          />
        </Menu>

        <View
          style={[
            styles.inputShell,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outlineVariant ?? theme.colors.outline,
            },
          ]}
        >
          <RNTextInput
            placeholder={placeholder}
            placeholderTextColor={theme.colors.onSurfaceDisabled}
            value={draft}
            onChangeText={onChangeDraft}
            style={[styles.input, { color: theme.colors.onSurface }]}
            editable={!sending}
            multiline={false}
            blurOnSubmit
            returnKeyType="send"
            enterKeyHint="send"
            enablesReturnKeyAutomatically
            onSubmitEditing={() => {
              if (canSend) onSend();
            }}
            accessibilityLabel="Message input"
          />
        </View>

        {sending ? (
          <IconButton
            icon="stop"
            mode="contained"
            containerColor={theme.colors.error}
            iconColor={theme.colors.onError}
            size={22}
            onPress={onStop}
            accessibilityLabel="Stop generation"
            style={styles.sideBtn}
          />
        ) : (
          <IconButton
            icon="send"
            mode="contained"
            containerColor={
              canSend ? theme.colors.primary : theme.colors.surfaceDisabled
            }
            iconColor={canSend ? theme.colors.onPrimary : theme.colors.onSurfaceDisabled}
            size={22}
            disabled={!canSend}
            onPress={onSend}
            accessibilityLabel="Send message"
            style={styles.sideBtn}
          />
        )}
      </View>
      {busy || listening ? (
        <View style={styles.footerHint}>
          {busy ? <ActivityIndicator size={14} /> : null}
          {listening ? (
            <Text variant="labelSmall" style={{ color: theme.colors.error }}>
              Listening…
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%' },
  attachList: { maxHeight: 52, marginBottom: 8 },
  attachListContent: { gap: 8, paddingRight: 8, alignItems: 'center' },
  attachChip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 180,
    paddingLeft: 10,
    paddingRight: 2,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  attachName: { flexShrink: 1, maxWidth: 110 },
  attachClose: { margin: 0 },
  status: { marginBottom: 6 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  sideBtn: { margin: 0 },
  inputShell: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 120,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 48,
    height: 48,
    overflow: 'hidden',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: 48,
    paddingVertical: 0,
    margin: 0,
    fontSize: 16,
  },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
});
