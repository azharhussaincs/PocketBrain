import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  countCharacters,
  countWords,
  documentPlainText,
  plainFromSpans,
} from '../utils/blocks';
import { createEditorState, editorReducer } from '../editor/documentReducer';
import { RichDocumentEditor } from '../editor/RichDocumentEditor';
import { EditorToolbar } from '../editor/EditorToolbar';
import { useAutosave } from '../hooks/useAutosave';
import { workspaceService } from '../services/WorkspaceService';
import type {
  AIEditAction,
  ExportFormat,
  WorkspaceDocument,
} from '../types/document';
import type { WorkspaceStackParamList } from '../../app/navigation/types';

type Props = NativeStackScreenProps<WorkspaceStackParamList, 'DocumentEditor'>;

export function DocumentEditorScreen({ route, navigation }: Props) {
  const [doc, setDoc] = useState<WorkspaceDocument | null>(null);
  const [editor, dispatch] = useReducer(editorReducer, createEditorState({ blocks: [] }));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [findOpen, setFindOpen] = useState(false);
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');

  useEffect(() => {
    const loaded = workspaceService.storage.getDocument(route.params.documentId);
    if (!loaded) {
      Alert.alert('Missing document', 'This file could not be found.');
      navigation.goBack();
      return;
    }
    setDoc(loaded);
    setTitle(loaded.title);
    dispatch({ type: 'setBody', body: loaded.body });
    setSelectedBlockId(loaded.body.blocks[0]?.id ?? null);
    setDirty(false);
    void workspaceService.storage.touchOpened(loaded.id);

    const recovery = workspaceService.storage.readRecovery(loaded.id);
    if (recovery && recovery.updatedAt > loaded.updatedAt) {
      Alert.alert('Recover unsaved changes?', 'A newer local recovery draft was found.', [
        { text: 'Discard', style: 'cancel', onPress: () => workspaceService.storage.clearRecovery(loaded.id) },
        {
          text: 'Restore',
          onPress: () => {
            setDoc(recovery);
            setTitle(recovery.title);
            dispatch({ type: 'setBody', body: recovery.body });
            setDirty(true);
          },
        },
      ]);
    }
  }, [route.params.documentId, navigation]);

  const workingDoc = useMemo(() => {
    if (!doc) return null;
    return { ...doc, title, body: editor.body };
  }, [doc, title, editor.body]);

  useAutosave(workingDoc, dirty, (saved) => {
    setDoc(saved);
    setDirty(false);
  });

  useEffect(() => {
    navigation.setOptions({
      title: title || 'Editor',
      headerRight: () => (
        <Button
          compact
          onPress={async () => {
            if (!workingDoc) return;
            setBusy(true);
            try {
              const saved = await workspaceService.save(workingDoc, {
                createVersion: true,
                versionLabel: 'Manual save',
              });
              setDoc(saved);
              setDirty(false);
            } finally {
              setBusy(false);
            }
          }}
        >
          Save
        </Button>
      ),
    });
  }, [navigation, title, workingDoc]);

  const plain = workingDoc ? documentPlainText(workingDoc.body) : '';
  const words = countWords(plain);
  const chars = countCharacters(plain);
  const formats = workingDoc
    ? workspaceService.defaultExportFormats(workingDoc.type)
    : (['docx', 'pdf'] as ExportFormat[]);

  const onExport = async (format: ExportFormat) => {
    if (!workingDoc) return;
    setBusy(true);
    try {
      const saved = await workspaceService.save(workingDoc);
      setDoc(saved);
      setDirty(false);
      await workspaceService.export(saved, format);
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  const onAiEdit = async (action: AIEditAction) => {
    if (!workingDoc || !selectedBlockId) {
      Alert.alert('Select a block', 'Tap a block first, then run an AI edit action.');
      return;
    }
    const block = editor.body.blocks.find((b) => b.id === selectedBlockId);
    if (!block) return;
    const source = plainFromSpans(block.spans);
    setBusy(true);
    try {
      const next = await workspaceService.aiEdit({ action, text: source });
      dispatch({ type: 'setBlockText', blockId: selectedBlockId, text: next });
      setDirty(true);
    } catch (error) {
      Alert.alert('AI edit failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  if (!doc || !workingDoc) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          setDirty(true);
        }}
        style={styles.title}
        dense
      />

      <EditorToolbar
        canUndo={editor.past.length > 0}
        canRedo={editor.future.length > 0}
        selectedBlockId={selectedBlockId}
        exportFormats={formats}
        busy={busy}
        onDispatch={(command) => {
          dispatch(command);
          setDirty(true);
        }}
        onExport={onExport}
        onAiEdit={onAiEdit}
        onFindReplace={() => setFindOpen(true)}
      />

      <RichDocumentEditor
        body={editor.body}
        selectedBlockId={selectedBlockId}
        onSelectBlock={setSelectedBlockId}
        dispatch={(command) => {
          dispatch(command);
          setDirty(true);
        }}
      />

      <View style={styles.status}>
        <Text variant="labelSmall">
          {words} words · {chars} chars · {dirty ? 'Unsaved' : 'Saved'}
          {busy ? ' · Working…' : ''}
        </Text>
        {workingDoc.versions.length ? (
          <Button
            compact
            onPress={() => {
              const latest = workingDoc.versions[0];
              Alert.alert(
                'Version history',
                workingDoc.versions
                  .slice(0, 8)
                  .map((v) => `${v.label} · ${new Date(v.createdAt).toLocaleString()}`)
                  .join('\n'),
                [
                  {
                    text: `Restore latest (${latest.label})`,
                    onPress: () => {
                      const restored = workspaceService.storage.restoreVersion(
                        workingDoc.id,
                        latest.id,
                      );
                      if (restored) {
                        setDoc(restored);
                        setTitle(restored.title);
                        dispatch({ type: 'setBody', body: restored.body });
                        setDirty(true);
                      }
                    },
                  },
                  { text: 'Close', style: 'cancel' },
                ],
              );
            }}
          >
            Versions ({workingDoc.versions.length})
          </Button>
        ) : null}
      </View>

      <Portal>
        <Dialog visible={findOpen} onDismiss={() => setFindOpen(false)}>
          <Dialog.Title>Find & Replace</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Find" value={find} onChangeText={setFind} mode="outlined" />
            <TextInput
              label="Replace"
              value={replace}
              onChangeText={setReplace}
              mode="outlined"
              style={{ marginTop: 8 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setFindOpen(false)}>Close</Button>
            <Button
              onPress={() => {
                dispatch({ type: 'findReplace', find, replace, all: false });
                setDirty(true);
              }}
            >
              Replace
            </Button>
            <Button
              onPress={() => {
                dispatch({ type: 'findReplace', find, replace, all: true });
                setDirty(true);
                setFindOpen(false);
              }}
            >
              Replace all
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: 8 },
  status: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
});
