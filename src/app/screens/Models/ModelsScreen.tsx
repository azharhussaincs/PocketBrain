import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { getListingById } from '../../../data/catalog';
import { toFriendlyCard } from '../../../discover/recommendations';
import { formatBytes } from '../../../utils/format';
import { useAppStore } from '../../../store/appStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { modelManager } from '../../../services/ModelManager';
import { aiService } from '../../../services/AIService';
import { useChatStore } from '../../../store/chatStore';
import { FriendlyModelCard } from '../../../components/FriendlyModelCard';
import { EmptyState } from '../../../components/EmptyState';
import { LIST_PERF } from '../../../utils/listPerf';
import type { RootTabParamList } from '../../navigation/types';
import { installedUpdateCandidates } from '../../../discover/discovery';

export function ModelsScreen() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const installed = useAppStore((s) => s.installed);
  const wifiOnly = useSettingsStore((s) => s.wifiOnlyDownloads);
  const autoCheck = useSettingsStore((s) => s.autoCheckModelUpdates);
  const createConversation = useChatStore((s) => s.createConversation);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updates = useMemo(
    () => (autoCheck ? installedUpdateCandidates() : []),
    [autoCheck, installed],
  );

  const cards = useMemo(() => {
    const rows = installed
      .filter((m) => m.status === 'installed')
      .map((m) => ({ record: m, card: toFriendlyCard(m.listingId) }))
      .filter(
        (
          x,
        ): x is {
          record: (typeof installed)[0];
          card: NonNullable<ReturnType<typeof toFriendlyCard>>;
        } => x.card != null,
      );
    rows.sort((a, b) => Number(b.record.favorite) - Number(a.record.favorite));
    return rows;
  }, [installed]);

  const total = installed.reduce((sum, m) => sum + (m.sizeBytes || 0), 0);

  const testModel = async (modelId: string) => {
    setTestingId(modelId);
    try {
      const result = await aiService.generateText({
        modelId,
        prompt: 'Reply with one short sentence confirming you are running locally.',
        maxTokens: 40,
        temperature: 0.2,
      });
      Alert.alert('Test passed', result.text.slice(0, 280) || 'Model responded.');
    } catch (error) {
      Alert.alert('Test failed', error instanceof Error ? error.message : 'Error');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">My Models</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Storage used: {formatBytes(total)} · You own these files
      </Text>
      {updates.length ? (
        <Text variant="bodySmall" style={styles.subtitle}>
          {updates.length} catalog model(s) available to reinstall/update. Update verifies the
          download and rolls back if it fails.
        </Text>
      ) : null}

      <FlatList
        {...LIST_PERF}
        data={cards}
        keyExtractor={(item) => item.record.listingId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No models installed yet"
            description="Open Home, pick a task, and download a recommended model. You can keep multiple models installed and delete any of them anytime."
            actionLabel="Browse Marketplace"
            onAction={() => navigation.navigate('MarketplaceTab')}
          />
        }
        renderItem={({ item }) => {
          const listing = getListingById(item.record.listingId);
          return (
            <View>
              <FriendlyModelCard
                model={{ ...item.card, installed: true }}
                primaryLabel="Details"
                busy={false}
              />
              <Text variant="bodySmall" style={styles.meta}>
                Last used:{' '}
                {item.record.lastUsedAt
                  ? new Date(item.record.lastUsedAt).toLocaleString()
                  : 'Never'}{' '}
                · Uses: {item.record.usageCount ?? 0}
                {item.record.favorite ? ' · Favorite' : ''}
              </Text>
              <Text variant="bodySmall" style={styles.meta}>
                Runtime: {listing?.preferredRuntime ?? item.card.runtime} · Version:{' '}
                {listing?.version ?? listing?.parameterCount ?? '—'}
              </Text>
              <View style={styles.actions}>
                <Button
                  compact
                  mode="contained"
                  onPress={() => {
                    createConversation(item.record.listingId);
                    navigation.navigate('ChatTab');
                  }}
                >
                  Open
                </Button>
                <Button
                  compact
                  mode="outlined"
                  loading={testingId === item.record.listingId}
                  onPress={() => testModel(item.record.listingId)}
                >
                  Test
                </Button>
                <Button
                  compact
                  mode="outlined"
                  loading={updatingId === item.record.listingId}
                  onPress={() => {
                    if (!listing) return;
                    Alert.alert(
                      'Update / reinstall',
                      `Re-download ${item.card.friendlyName}? The previous file will be replaced.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Update',
                          onPress: async () => {
                            try {
                              setUpdatingId(item.record.listingId);
                              await modelManager.updateOrReinstall(listing, wifiOnly);
                              Alert.alert('Updated', 'Model reinstalled successfully.');
                            } catch (error) {
                              Alert.alert(
                                'Update failed',
                                error instanceof Error ? error.message : 'Error',
                              );
                            } finally {
                              setUpdatingId(null);
                            }
                          },
                        },
                      ],
                    );
                  }}
                >
                  Update
                </Button>
                <Button
                  compact
                  mode="outlined"
                  onPress={() =>
                    modelManager.setFavorite(
                      item.record.listingId,
                      !item.record.favorite,
                    )
                  }
                >
                  {item.record.favorite ? 'Unfavorite' : 'Favorite'}
                </Button>
                <Button
                  compact
                  mode="outlined"
                  onPress={() => {
                    setRenameId(item.record.listingId);
                    setRenameValue(item.record.localName);
                  }}
                >
                  Rename
                </Button>
                <Button
                  compact
                  mode="outlined"
                  textColor="#B91C1C"
                  onPress={() =>
                    Alert.alert('Remove model', `Delete ${item.card.friendlyName}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => modelManager.delete(item.record.listingId),
                      },
                    ])
                  }
                >
                  Remove
                </Button>
              </View>
            </View>
          );
        }}
      />

      <Portal>
        <Dialog visible={renameId != null} onDismiss={() => setRenameId(null)}>
          <Dialog.Title>Rename model</Dialog.Title>
          <Dialog.Content>
            <TextInput value={renameValue} onChangeText={setRenameValue} mode="outlined" />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameId(null)}>Cancel</Button>
            <Button
              onPress={async () => {
                if (renameId) await modelManager.rename(renameId, renameValue.trim() || 'Model');
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
  container: { flex: 1, padding: 16 },
  subtitle: { opacity: 0.7, marginBottom: 12 },
  list: { paddingBottom: 32 },
  empty: { marginTop: 48, textAlign: 'center', opacity: 0.7 },
  meta: { opacity: 0.7, marginTop: 2, marginBottom: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
});
