import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { List, Searchbar } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { globalSearch } from '../../../search/globalSearch';
import type { HomeStackParamList } from '../../navigation/types';
import { useChatStore } from '../../../store/chatStore';
import { EmptyState } from '../../../components/EmptyState';
import { LIST_PERF } from '../../../utils/listPerf';

type Props = NativeStackScreenProps<HomeStackParamList, 'GlobalSearch'>;

export function GlobalSearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const setActive = useChatStore((s) => s.setActive);
  const results = useMemo(() => globalSearch(query), [query]);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search documents, chats, models, tasks"
        value={query}
        onChangeText={setQuery}
        autoFocus
        accessibilityLabel="Global search field"
      />
      <FlatList
        {...LIST_PERF}
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title={query.trim() ? 'No matches on this device' : 'Search locally'}
            description={
              query.trim()
                ? 'Try another keyword. Search covers chats, documents, models, and tasks stored on this phone.'
                : 'Type to search documents, chats, models, and tasks — nothing leaves the device.'
            }
          />
        }
        renderItem={({ item }) => (
          <List.Item
            title={item.title}
            description={`${item.kind} · ${item.subtitle}`}
            onPress={() => {
              const hint = item.routeHint;
              if (hint.type === 'document') {
                navigation.getParent()?.navigate('WorkspaceTab', {
                  screen: 'DocumentEditor',
                  params: { documentId: hint.documentId },
                });
              } else if (hint.type === 'chat') {
                const id = item.id.replace('chat-', '');
                setActive(id);
                navigation.getParent()?.navigate('ChatTab');
              } else if (hint.type === 'model') {
                navigation.getParent()?.navigate('MarketplaceTab', {
                  screen: 'ModelDetail',
                  params: { modelId: hint.modelId },
                });
              } else if (hint.type === 'task') {
                navigation.navigate('TaskDetail', { taskId: hint.taskId });
              } else if (hint.type === 'files') {
                navigation.navigate('Files');
              }
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  list: { paddingBottom: 32 },
  empty: { textAlign: 'center', marginTop: 48, opacity: 0.7 },
});
