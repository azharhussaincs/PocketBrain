import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Button,
  Chip,
  FAB,
  Menu,
  Searchbar,
  Text,
  useTheme,
} from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatBytes } from '../../utils/format';
import { LIST_PERF } from '../../utils/listPerf';
import { workspaceService } from '../services/WorkspaceService';
import type {
  WorkspaceDocType,
  WorkspaceDocumentMeta,
  WorkspaceFolder,
} from '../types/document';
import type { WorkspaceStackParamList } from '../../app/navigation/types';

type Props = NativeStackScreenProps<WorkspaceStackParamList, 'WorkspaceHome'>;

const CATEGORIES: Array<{ id: WorkspaceDocType | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'document', label: 'Docs' },
  { id: 'presentation', label: 'Slides' },
  { id: 'spreadsheet', label: 'Sheets' },
  { id: 'pdf', label: 'PDF' },
  { id: 'markdown', label: 'MD' },
  { id: 'html', label: 'HTML' },
  { id: 'note', label: 'Notes' },
  { id: 'code', label: 'Code' },
  { id: 'json', label: 'JSON' },
  { id: 'csv', label: 'CSV' },
  { id: 'mermaid', label: 'Mermaid' },
  { id: 'svg', label: 'SVG' },
];

export function WorkspaceDashboardScreen({ navigation }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 3 : width >= 600 ? 2 : 1;

  const [query, setQuery] = useState('');
  const [type, setType] = useState<WorkspaceDocType | 'all'>('all');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'favorite' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'title' | 'lastOpenedAt'>('updatedAt');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [docs, setDocs] = useState<WorkspaceDocumentMeta[]>([]);
  const [folders, setFolders] = useState<WorkspaceFolder[]>([]);
  const [sortMenu, setSortMenu] = useState(false);
  const [createMenu, setCreateMenu] = useState(false);

  const refresh = useCallback(() => {
    setFolders(workspaceService.storage.listFolders());
    setDocs(
      workspaceService.search({
        text: query,
        type,
        folderId: folderId === null ? undefined : folderId,
        pinned: filter === 'pinned' ? true : undefined,
        favorite: filter === 'favorite' ? true : undefined,
        recentDays: filter === 'recent' ? 14 : undefined,
        sortBy,
        sortDir: sortBy === 'title' ? 'asc' : 'desc',
      }),
    );
  }, [query, type, filter, sortBy, folderId]);

  useEffect(() => {
    refresh();
    return workspaceService.storage.subscribe(() => refresh());
  }, [refresh]);

  const storageUsed = useMemo(
    () => workspaceService.storage.totalStorageBytes(),
    [docs],
  );

  const openDoc = async (id: string) => {
    await workspaceService.storage.touchOpened(id);
    navigation.navigate('DocumentEditor', { documentId: id });
  };

  const createBlank = async (docType: WorkspaceDocType) => {
    setCreateMenu(false);
    const doc = await workspaceService.createBlank({
      title: `Untitled ${docType}`,
      type: docType,
      folderId,
    });
    navigation.navigate('DocumentEditor', { documentId: doc.id });
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Workspace</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Create, edit, and export documents offline · {formatBytes(storageUsed)} used
      </Text>

      <Searchbar
        placeholder="Search files"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        renderItem={({ item }) => (
          <Chip
            selected={type === item.id}
            onPress={() => setType(item.id)}
            style={styles.chip}
            compact
          >
            {item.label}
          </Chip>
        )}
      />

      <View style={styles.filters}>
        {(['all', 'pinned', 'favorite', 'recent'] as const).map((f) => (
          <Chip key={f} selected={filter === f} onPress={() => setFilter(f)} compact>
            {f}
          </Chip>
        ))}
        <Menu
          visible={sortMenu}
          onDismiss={() => setSortMenu(false)}
          anchor={
            <Button compact onPress={() => setSortMenu(true)}>
              Sort
            </Button>
          }
        >
          <Menu.Item onPress={() => { setSortBy('updatedAt'); setSortMenu(false); }} title="Updated" />
          <Menu.Item onPress={() => { setSortBy('lastOpenedAt'); setSortMenu(false); }} title="Recent" />
          <Menu.Item onPress={() => { setSortBy('title'); setSortMenu(false); }} title="Title" />
        </Menu>
      </View>

      <View style={styles.folderRow}>
        <Chip selected={folderId === null} onPress={() => setFolderId(null)} compact>
          All folders
        </Chip>
        {folders.map((folder) => (
          <Chip
            key={folder.id}
            selected={folderId === folder.id}
            onPress={() => setFolderId(folder.id)}
            onLongPress={() =>
              Alert.alert(folder.name, 'Folder actions', [
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await workspaceService.storage.deleteFolder(folder.id);
                    setFolderId(null);
                    refresh();
                  },
                },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
            compact
          >
            {folder.name}
          </Chip>
        ))}
        <Button
          compact
          onPress={async () => {
            await workspaceService.storage.createFolder('New Folder', null);
            refresh();
          }}
        >
          + Folder
        </Button>
      </View>

      <View style={styles.actions}>
        <Button mode="contained" onPress={() => navigation.navigate('AICreator')}>
          AI Create
        </Button>
        <Button mode="outlined" onPress={() => navigation.navigate('Templates')}>
          Templates
        </Button>
        <Button
          mode="outlined"
          onPress={async () => {
            const imported = await workspaceService.importTextFile();
            if (imported) navigation.navigate('DocumentEditor', { documentId: imported.id });
          }}
        >
          Import
        </Button>
      </View>

      <FlatList
        {...LIST_PERF}
        key={`cols-${numColumns}`}
        data={docs}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No files yet. Use AI Create or Templates to start a professional document.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openDoc(item.id)}
            onLongPress={() =>
              Alert.alert(item.title, undefined, [
                {
                  text: item.pinned ? 'Unpin' : 'Pin',
                  onPress: () => workspaceService.storage.setFlags(item.id, { pinned: !item.pinned }),
                },
                {
                  text: item.favorite ? 'Unfavorite' : 'Favorite',
                  onPress: () =>
                    workspaceService.storage.setFlags(item.id, { favorite: !item.favorite }),
                },
                {
                  text: 'Duplicate',
                  onPress: async () => {
                    const copy = await workspaceService.storage.duplicateDocument(item.id);
                    if (copy) navigation.navigate('DocumentEditor', { documentId: copy.id });
                  },
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => workspaceService.storage.deleteDocument(item.id),
                },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant ?? theme.colors.outline,
                flex: 1 / numColumns,
              },
            ]}
          >
            <Text variant="titleMedium" numberOfLines={2}>
              {item.pinned ? 'Pinned · ' : ''}
              {item.favorite ? '★ ' : ''}
              {item.title}
            </Text>
            <Text variant="bodySmall" style={styles.meta}>
              {item.type} · {formatBytes(item.sizeBytes)}
            </Text>
            <Text variant="bodySmall" style={styles.meta}>
              Updated {new Date(item.updatedAt).toLocaleString()}
            </Text>
          </Pressable>
        )}
      />

      <Menu
        visible={createMenu}
        onDismiss={() => setCreateMenu(false)}
        anchor={
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => setCreateMenu(true)}
            label="New"
          />
        }
      >
        <Menu.Item onPress={() => createBlank('document')} title="Document" />
        <Menu.Item onPress={() => createBlank('presentation')} title="Presentation" />
        <Menu.Item onPress={() => createBlank('spreadsheet')} title="Spreadsheet" />
        <Menu.Item onPress={() => createBlank('pdf')} title="PDF draft" />
        <Menu.Item onPress={() => createBlank('markdown')} title="Markdown" />
        <Menu.Item onPress={() => createBlank('note')} title="Note" />
        <Menu.Item onPress={() => createBlank('code')} title="Code file" />
        <Menu.Item onPress={() => navigation.navigate('AICreator')} title="AI Create…" />
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  subtitle: { opacity: 0.7, marginBottom: 10 },
  search: { marginBottom: 8 },
  chips: { maxHeight: 44, marginBottom: 8 },
  chip: { marginRight: 6 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  folderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8, alignItems: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  list: { paddingBottom: 120 },
  empty: { textAlign: 'center', marginTop: 48, opacity: 0.7 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    margin: 6,
    minHeight: 110,
  },
  meta: { opacity: 0.65, marginTop: 4 },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
