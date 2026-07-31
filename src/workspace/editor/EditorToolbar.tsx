import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Menu, Text } from 'react-native-paper';
import type { AIEditAction, ExportFormat, TextMark } from '../types/document';
import { createBlock } from '../utils/blocks';
import type { EditorCommand } from './documentReducer';

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  selectedBlockId: string | null;
  exportFormats: ExportFormat[];
  onDispatch: (command: EditorCommand) => void;
  onExport: (format: ExportFormat) => void;
  onAiEdit: (action: AIEditAction) => void;
  onFindReplace: () => void;
  busy?: boolean;
}

const AI_ACTIONS: Array<{ action: AIEditAction; label: string }> = [
  { action: 'rewrite', label: 'Rewrite' },
  { action: 'summarize', label: 'Summarize' },
  { action: 'expand', label: 'Expand' },
  { action: 'shorten', label: 'Shorten' },
  { action: 'grammar', label: 'Grammar' },
  { action: 'tone_professional', label: 'Professional' },
  { action: 'tone_friendly', label: 'Friendly' },
  { action: 'tone_academic', label: 'Academic' },
  { action: 'bullets', label: 'Bullets' },
  { action: 'readability', label: 'Readability' },
  { action: 'continue', label: 'Continue' },
  { action: 'translate', label: 'Translate' },
];

export function EditorToolbar({
  canUndo,
  canRedo,
  selectedBlockId,
  exportFormats,
  onDispatch,
  onExport,
  onAiEdit,
  onFindReplace,
  busy,
}: Props) {
  const [exportOpen, setExportOpen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [insertOpen, setInsertOpen] = React.useState(false);

  const toggleMark = (mark: TextMark) => {
    if (!selectedBlockId) return;
    onDispatch({ type: 'toggleMark', blockId: selectedBlockId, mark });
  };

  const insert = (type: Parameters<typeof createBlock>[0]) => {
    onDispatch({
      type: 'addBlock',
      afterId: selectedBlockId ?? undefined,
      block: createBlock(type, type === 'divider' ? '' : ''),
    });
    setInsertOpen(false);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <IconButton
          icon="undo"
          accessibilityLabel="Undo"
          disabled={!canUndo || busy}
          onPress={() => onDispatch({ type: 'undo' })}
        />
        <IconButton
          icon="redo"
          accessibilityLabel="Redo"
          disabled={!canRedo || busy}
          onPress={() => onDispatch({ type: 'redo' })}
        />
        <IconButton
          icon="format-bold"
          accessibilityLabel="Bold"
          disabled={!selectedBlockId || busy}
          onPress={() => toggleMark('bold')}
        />
        <IconButton
          icon="format-italic"
          accessibilityLabel="Italic"
          disabled={!selectedBlockId || busy}
          onPress={() => toggleMark('italic')}
        />
        <IconButton
          icon="format-underline"
          accessibilityLabel="Underline"
          disabled={!selectedBlockId || busy}
          onPress={() => toggleMark('underline')}
        />
        <IconButton
          icon="marker"
          accessibilityLabel="Highlight"
          disabled={!selectedBlockId || busy}
          onPress={() => toggleMark('highlight')}
        />
        <IconButton
          icon="code-tags"
          accessibilityLabel="Code mark"
          disabled={!selectedBlockId || busy}
          onPress={() => toggleMark('code')}
        />
        <IconButton
          icon="magnify"
          accessibilityLabel="Find and replace"
          disabled={busy}
          onPress={onFindReplace}
        />

        <Menu
          visible={insertOpen}
          onDismiss={() => setInsertOpen(false)}
          anchor={
            <IconButton
              icon="plus-box-outline"
              accessibilityLabel="Insert block"
              onPress={() => setInsertOpen(true)}
            />
          }
        >
          <Menu.Item onPress={() => insert('heading1')} title="Heading 1" />
          <Menu.Item onPress={() => insert('heading2')} title="Heading 2" />
          <Menu.Item onPress={() => insert('paragraph')} title="Paragraph" />
          <Menu.Item onPress={() => insert('bullet')} title="Bullet list" />
          <Menu.Item onPress={() => insert('numbered')} title="Numbered list" />
          <Menu.Item onPress={() => insert('checkbox')} title="Checkbox" />
          <Menu.Item onPress={() => insert('code')} title="Code block" />
          <Menu.Item onPress={() => insert('quote')} title="Quote" />
          <Menu.Item onPress={() => insert('divider')} title="Divider" />
        </Menu>

        <Menu
          visible={aiOpen}
          onDismiss={() => setAiOpen(false)}
          anchor={
            <IconButton
              icon="auto-fix"
              accessibilityLabel="AI edit actions"
              disabled={busy}
              onPress={() => setAiOpen(true)}
            />
          }
        >
          {AI_ACTIONS.map((item) => (
            <Menu.Item
              key={item.action}
              title={item.label}
              onPress={() => {
                setAiOpen(false);
                onAiEdit(item.action);
              }}
            />
          ))}
        </Menu>

        <Menu
          visible={exportOpen}
          onDismiss={() => setExportOpen(false)}
          anchor={
            <IconButton
              icon="export-variant"
              accessibilityLabel="Export document"
              onPress={() => setExportOpen(true)}
            />
          }
        >
          {exportFormats.map((format) => (
            <Menu.Item
              key={format}
              title={`Export ${format.toUpperCase()}`}
              onPress={() => {
                setExportOpen(false);
                onExport(format);
              }}
            />
          ))}
        </Menu>
      </ScrollView>
      <Text variant="labelSmall" style={styles.hint}>
        Select a block, then format or run AI actions on it.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#CBD5E1', paddingBottom: 4 },
  row: { alignItems: 'center', paddingHorizontal: 4 },
  hint: { opacity: 0.6, paddingHorizontal: 12, paddingBottom: 4 },
});
