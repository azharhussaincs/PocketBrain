import React from 'react';
import { Alert, Share, StyleSheet, View } from 'react-native';
import { IconButton, Menu, Text } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { generatedContentStore } from '../files/GeneratedContentStore';
import { workspaceService } from '../workspace/services/WorkspaceService';
import { createBlock } from '../workspace/utils/blocks';
import { exportService } from '../workspace/exporters/ExportService';

export interface ResponseActionHandlers {
  onRegenerate?: () => void;
  onContinue?: () => void;
  onEditPrompt?: () => void;
  onDelete?: () => void;
  onFavorite?: () => void;
  favorited?: boolean;
}

interface Props extends ResponseActionHandlers {
  text: string;
  title?: string;
  disabled?: boolean;
  onOpenInWorkspace?: (documentId: string) => void;
}

async function writeTempAndShare(text: string, fileName: string) {
  const file = new File(Paths.cache, fileName);
  file.write(text);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri);
  } else {
    await Share.share({ message: text });
  }
}

/**
 * Universal actions for every AI response — copy always one tap.
 */
export function ResponseActions({
  text,
  title = 'AI response',
  disabled,
  onRegenerate,
  onContinue,
  onEditPrompt,
  onDelete,
  onFavorite,
  favorited,
  onOpenInWorkspace,
}: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const usable = Boolean(text?.trim()) && !disabled;

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', 'Response copied to clipboard.');
    } catch (error) {
      Alert.alert('Copy failed', error instanceof Error ? error.message : 'Could not copy.');
    }
  };

  const share = async () => {
    try {
      await Share.share({ message: text, title });
    } catch {
      // user cancelled
    }
  };

  const save = async () => {
    try {
      await generatedContentStore.saveText({
        title,
        content: text,
        kind: 'ai_output',
        source: 'response_actions',
      });
      Alert.alert('Saved', 'Saved to AI Outputs in Files.');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Could not save.');
    }
  };

  const openWorkspace = async () => {
    try {
      const doc = await workspaceService.createBlank({
        type: 'document',
        title: title.slice(0, 60) || 'From AI',
        body: { blocks: [createBlock('paragraph', text)] },
      });
      onOpenInWorkspace?.(doc.id);
      Alert.alert('Opened in Workspace', 'Document created for editing.');
    } catch (error) {
      Alert.alert(
        'Workspace failed',
        error instanceof Error ? error.message : 'Could not create document.',
      );
    }
  };

  const exportFmt = async (format: 'txt' | 'markdown' | 'html' | 'json' | 'docx' | 'pdf') => {
    const doc = await workspaceService.createBlank({
      type: 'document',
      title: title.slice(0, 60) || 'Export',
      body: { blocks: [createBlock('paragraph', text)] },
    });
    try {
      const { file } = await exportService.export(doc, format);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
      } else {
        await writeTempAndShare(text, `pocketbrain-${Date.now()}.txt`);
      }
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Error');
    }
  };

  return (
    <View style={styles.row} accessibilityRole="toolbar">
      <IconButton
        icon="content-copy"
        size={20}
        disabled={!usable}
        onPress={() => void copy()}
        accessibilityLabel="Copy response"
        accessibilityHint="Copies the AI response to the clipboard"
        style={styles.iconBtn}
      />
      <IconButton
        icon="share-variant"
        size={20}
        disabled={!usable}
        onPress={() => void share()}
        accessibilityLabel="Share response"
        style={styles.iconBtn}
      />
      <IconButton
        icon="content-save-outline"
        size={20}
        disabled={!usable}
        onPress={() => void save()}
        accessibilityLabel="Save response"
        style={styles.iconBtn}
      />
      {onRegenerate ? (
        <IconButton
          icon="refresh"
          size={20}
          disabled={disabled}
          onPress={onRegenerate}
          accessibilityLabel="Regenerate"
          style={styles.iconBtn}
        />
      ) : null}
      {onContinue ? (
        <IconButton
          icon="arrow-right-bold"
          size={20}
          disabled={disabled}
          onPress={onContinue}
          accessibilityLabel="Continue generation"
          style={styles.iconBtn}
        />
      ) : null}
      {onFavorite ? (
        <IconButton
          icon={favorited ? 'star' : 'star-outline'}
          size={20}
          onPress={onFavorite}
          accessibilityLabel="Favorite"
          style={styles.iconBtn}
        />
      ) : null}
      <Menu
        visible={menuOpen}
        onDismiss={() => setMenuOpen(false)}
        anchor={
          <IconButton
            icon="dots-horizontal"
            size={20}
            disabled={!usable}
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="More actions"
            style={styles.iconBtn}
          />
        }
      >
        <Menu.Item
          onPress={() => {
            setMenuOpen(false);
            void openWorkspace();
          }}
          title="Open in Workspace"
        />
        <Menu.Item
          onPress={() => {
            setMenuOpen(false);
            void exportFmt('txt');
          }}
          title="Export TXT"
        />
        <Menu.Item
          onPress={() => {
            setMenuOpen(false);
            void exportFmt('markdown');
          }}
          title="Export Markdown"
        />
        <Menu.Item
          onPress={() => {
            setMenuOpen(false);
            void exportFmt('docx');
          }}
          title="Export DOCX"
        />
        <Menu.Item
          onPress={() => {
            setMenuOpen(false);
            void exportFmt('pdf');
          }}
          title="Export PDF"
        />
        <Menu.Item
          onPress={() => {
            setMenuOpen(false);
            void exportFmt('html');
          }}
          title="Export HTML"
        />
        <Menu.Item
          onPress={() => {
            setMenuOpen(false);
            void exportFmt('json');
          }}
          title="Export JSON"
        />
        {onEditPrompt ? (
          <Menu.Item
            onPress={() => {
              setMenuOpen(false);
              onEditPrompt();
            }}
            title="Edit prompt"
          />
        ) : null}
        {onDelete ? (
          <Menu.Item
            onPress={() => {
              setMenuOpen(false);
              onDelete();
            }}
            title="Delete"
          />
        ) : null}
      </Menu>
      <Text variant="labelSmall" style={styles.hint}>
        Copy
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  hint: { opacity: 0.5, marginLeft: -4 },
  iconBtn: { margin: 0, minWidth: 44, minHeight: 44 },
});
