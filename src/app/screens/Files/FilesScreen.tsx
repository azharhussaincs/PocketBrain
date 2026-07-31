import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  Portal,
  Searchbar,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import * as Sharing from 'expo-sharing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  FILE_CATEGORIES,
  fileExplorerService,
  type ExplorerEntry,
  type FileCategory,
} from '../../../files/FileExplorerService';
import { generatedContentStore } from '../../../files/GeneratedContentStore';
import { workspaceService } from '../../../workspace/services/WorkspaceService';
import { formatBytes } from '../../../utils/format';
import type { HomeStackParamList } from '../../navigation/types';
import { EmptyState } from '../../../components/EmptyState';
import { LIST_PERF } from '../../../utils/listPerf';

type Props = NativeStackScreenProps<HomeStackParamList, 'Files'> | { navigation: any };

export function FilesScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState<FileCategory>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'name' | 'size'>('recent');
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [multi, setMulti] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [tick, setTick] = useState(0);

  const columns = layout === 'grid' ? (width >= 900 ? 3 : 2) : 1;

  const entries = useMemo(() => {
    void tick;
    return fileExplorerService.list({ category, query, sort });
  }, [category, query, sort, tick]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openEntry = (item: ExplorerEntry) => {
    if (multi) {
      toggleSelect(item.id);
      return;
    }

    const aiActions = [
      {
        text: 'Summarize in Chat',
        onPress: () =>
          navigation.getParent?.()?.navigate('ChatTab') ??
          navigation.navigate('ChatTab'),
      },
      {
        text: 'Create PPT from topic',
        onPress: () =>
          navigation.getParent?.()?.navigate('WorkspaceTab', {
            screen: 'AICreator',
            params: {
              type: 'presentation',
              initialPrompt: `Create a professional presentation about: ${item.title}`,
            },
          }),
      },
    ];

    if (item.workspaceDocumentId) {
      Alert.alert(item.title, 'Choose an action', [
        { text: 'Open', onPress: () => openWorkspace(item.workspaceDocumentId!) },
        ...aiActions,
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    if (item.generatedId) {
      const gen = generatedContentStore.get(item.generatedId);
      if (gen?.content) {
        Alert.alert(gen.title, gen.content.slice(0, 800), [
          { text: 'Close', style: 'cancel' },
          {
            text: 'Open in Workspace',
            onPress: async () => {
              const doc = await workspaceService.createBlank({
                type: 'document',
                title: gen.title,
                body: {
                  blocks: [
                    {
                      id: gen.id,
                      type: 'paragraph',
                      spans: [{ text: gen.content ?? '' }],
                    },
                  ],
                },
              });
              openWorkspace(doc.id);
            },
          },
          {
            text: 'Ask in Chat',
            onPress: () =>
              navigation.getParent?.()?.navigate('ChatTab') ??
              navigation.navigate('ChatTab'),
          },
          {
            text: 'Share',
            onPress: () => void Share.share({ message: gen.content ?? '' }),
          },
        ]);
      }
      return;
    }
    if (item.path) {
      Alert.alert(item.title, item.path, [
        { text: 'OK', style: 'cancel' },
        ...aiActions,
      ]);
    }
  };

  const openWorkspace = (documentId: string) => {
    navigation.getParent?.()?.navigate('WorkspaceTab', {
      screen: 'DocumentEditor',
      params: { documentId },
    }) ??
      navigation.navigate('WorkspaceTab', {
        screen: 'DocumentEditor',
        params: { documentId },
      });
  };

  const deleteSelected = async () => {
    for (const id of selected) {
      const item = entries.find((e) => e.id === id);
      if (!item) continue;
      if (item.generatedId) await generatedContentStore.remove(item.generatedId);
      if (item.workspaceDocumentId) {
        await workspaceService.storage.deleteDocument(item.workspaceDocumentId);
      }
    }
    setSelected(new Set());
    setMulti(false);
    setTick((t) => t + 1);
  };

  const shareSelected = async () => {
    try {
      const texts: string[] = [];
      for (const id of selected) {
        const item = entries.find((e) => e.id === id);
        if (item?.generatedId) {
          const gen = generatedContentStore.get(item.generatedId);
          if (gen?.content) texts.push(`# ${gen.title}\n${gen.content}`);
        }
        if (item?.path && (await Sharing.isAvailableAsync())) {
          await Sharing.shareAsync(item.path);
        }
      }
      if (texts.length) await Share.share({ message: texts.join('\n\n') });
    } catch (error) {
      Alert.alert(
        'Share failed',
        error instanceof Error ? error.message : 'Could not share the selected files.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Files</Text>
      <Text variant="bodyMedium" style={styles.sub}>
        Your AI outputs, documents, and exports — all on this device.
      </Text>
      <Searchbar
        placeholder="Search files"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />
      <SegmentedButtons
        value={layout}
        onValueChange={(v) => setLayout(v as 'list' | 'grid')}
        buttons={[
          { value: 'list', label: 'List' },
          { value: 'grid', label: 'Grid' },
        ]}
        style={styles.segments}
      />
      <SegmentedButtons
        value={sort}
        onValueChange={(v) => setSort(v as 'recent' | 'name' | 'size')}
        buttons={[
          { value: 'recent', label: 'Recent' },
          { value: 'name', label: 'Name' },
          { value: 'size', label: 'Size' },
        ]}
        style={styles.segments}
      />
      <FlatList
        horizontal
        data={FILE_CATEGORIES}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        renderItem={({ item }) => (
          <Chip
            selected={category === item.id}
            onPress={() => setCategory(item.id)}
            style={styles.chip}
            compact
          >
            {item.label}
          </Chip>
        )}
      />

      <View style={styles.toolbar}>
        <Button compact mode={multi ? 'contained' : 'outlined'} onPress={() => setMulti((v) => !v)}>
          {multi ? 'Selecting…' : 'Multi-select'}
        </Button>
        {multi && selected.size > 0 ? (
          <>
            <Button compact onPress={() => void shareSelected()}>
              Share
            </Button>
            <Button compact textColor="#B91C1C" onPress={() => void deleteSelected()}>
              Delete
            </Button>
          </>
        ) : null}
        <Button compact onPress={() => setTick((t) => t + 1)}>
          Refresh
        </Button>
      </View>

      <FlatList
        {...LIST_PERF}
        data={entries}
        key={`layout-${layout}-${columns}`}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No files in this category"
            description="Exports, AI outputs, and documents you save will show up here."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openEntry(item)}
            onLongPress={() => {
              setMulti(true);
              toggleSelect(item.id);
            }}
            style={[styles.card, layout === 'grid' && styles.gridCard]}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            {multi ? (
              <Checkbox
                status={selected.has(item.id) ? 'checked' : 'unchecked'}
                onPress={() => toggleSelect(item.id)}
              />
            ) : null}
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" numberOfLines={2}>
                {item.favorite ? '★ ' : ''}
                {item.title}
              </Text>
              <Text variant="bodySmall" style={styles.meta}>
                {item.kind} · {item.category} · {formatBytes(item.sizeBytes)}
              </Text>
            </View>
            {item.generatedId ? (
              <Button
                compact
                onPress={() => {
                  setRenameId(item.generatedId!);
                  setRenameValue(item.title);
                }}
              >
                Rename
              </Button>
            ) : null}
          </Pressable>
        )}
      />

      <Portal>
        <Dialog visible={renameId != null} onDismiss={() => setRenameId(null)}>
          <Dialog.Title>Rename</Dialog.Title>
          <Dialog.Content>
            <TextInput value={renameValue} onChangeText={setRenameValue} mode="outlined" />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameId(null)}>Cancel</Button>
            <Button
              onPress={async () => {
                if (renameId) {
                  await generatedContentStore.rename(renameId, renameValue.trim() || 'File');
                  setTick((t) => t + 1);
                }
                setRenameId(null);
              }}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  sub: { opacity: 0.75, marginBottom: 8 },
  search: { marginBottom: 8 },
  segments: { marginBottom: 8 },
  chips: { maxHeight: 44, marginBottom: 8 },
  chip: { marginRight: 6 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  list: { paddingBottom: 40 },
  empty: { textAlign: 'center', marginTop: 48, opacity: 0.7 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  gridCard: { flex: 1, margin: 4, minHeight: 96 },
  meta: { opacity: 0.65, marginTop: 2 },
});
