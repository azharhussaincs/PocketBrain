import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, List, Text } from 'react-native-paper';
import { appStorageManager } from '../../../storage/AppStorageManager';
import { modelManager } from '../../../services/ModelManager';
import { formatBytes } from '../../../utils/format';
import { generatedContentStore } from '../../../files/GeneratedContentStore';

export function StorageScreen() {
  const [breakdown, setBreakdown] = useState(() => appStorageManager.getBreakdown());
  const [unused, setUnused] = useState(() => modelManager.unusedModels());

  const refresh = useCallback(() => {
    setBreakdown(appStorageManager.getBreakdown());
    setUnused(modelManager.unusedModels());
  }, []);

  const tips = appStorageManager.recommendations(breakdown);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">Storage</Text>
      <Text variant="bodyMedium" style={styles.sub}>
        Everything stays on this device. Free space before large model downloads.
      </Text>

      <List.Item title="AI models" description={formatBytes(breakdown.modelsBytes)} />
      <List.Item title="Workspace documents" description={formatBytes(breakdown.workspaceBytes)} />
      <List.Item title="AI outputs" description={formatBytes(generatedContentStore.totalBytes())} />
      <List.Item title="Exports" description={formatBytes(breakdown.exportsBytes)} />
      <List.Item
        title="Generated image jobs"
        description={formatBytes(breakdown.generatedImagesBytes)}
      />
      <List.Item title="Recovery drafts" description={formatBytes(breakdown.recoveryBytes)} />
      <List.Item title="App cache" description={formatBytes(breakdown.cacheBytes)} />
      <List.Item
        title="Tracked total"
        description={formatBytes(breakdown.totalTrackedBytes)}
      />
      <List.Item
        title="Free device storage"
        description={
          breakdown.freeDiskBytes != null ? formatBytes(breakdown.freeDiskBytes) : '—'
        }
      />

      <Text variant="titleMedium" style={styles.section}>
        Unused models
      </Text>
      {!unused.length ? (
        <Text style={styles.tip}>No unused models detected.</Text>
      ) : (
        unused.map((m) => (
          <List.Item
            key={m.listingId}
            title={m.localName}
            description={`${formatBytes(m.sizeBytes)} · uses ${m.usageCount ?? 0}`}
            right={() => (
              <Button
                compact
                textColor="#B91C1C"
                onPress={() => {
                  Alert.alert('Remove unused model', `Delete ${m.localName}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        await modelManager.delete(m.listingId);
                        refresh();
                      },
                    },
                  ]);
                }}
              >
                Remove
              </Button>
            )}
          />
        ))
      )}

      <Text variant="titleMedium" style={styles.section}>
        Recommendations
      </Text>
      {tips.map((tip) => (
        <Text key={tip} style={styles.tip}>
          • {tip}
        </Text>
      ))}

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={() => {
            const freed = appStorageManager.clearCache();
            refresh();
            Alert.alert('Cache cleared', `Freed about ${formatBytes(freed)}.`);
          }}
        >
          Clean cache
        </Button>
        <Button
          mode="outlined"
          onPress={() => {
            const freed = appStorageManager.clearExportCache();
            refresh();
            Alert.alert('Exports removed', `Freed about ${formatBytes(freed)}.`);
          }}
        >
          Remove exports
        </Button>
        <Button
          mode="outlined"
          onPress={() => {
            const freed = appStorageManager.clearRecoveryDrafts();
            refresh();
            Alert.alert('Recovery cleared', `Freed about ${formatBytes(freed)}.`);
          }}
        >
          Clear recovery drafts
        </Button>
        <Button mode="text" onPress={refresh}>
          Refresh
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  sub: { opacity: 0.75, marginBottom: 12 },
  section: { marginTop: 16, marginBottom: 8 },
  tip: { marginBottom: 6, lineHeight: 20 },
  actions: { marginTop: 20, gap: 10 },
});
