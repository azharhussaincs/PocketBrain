import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getListingById } from '../../../data/catalog';
import { formatBytes } from '../../../utils/format';
import { useAppStore } from '../../../store/appStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { modelManager } from '../../../services/ModelManager';
import { canInstallModel } from '../../../services/HardwareService';
import { useModelDownloadProgress } from '../../../hooks/useModelDownloadProgress';
import { DownloadProgressBlock } from '../../../components/DownloadProgressBlock';
import type { MarketplaceStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MarketplaceStackParamList, 'ModelDetail'>;

export function ModelDetailScreen({ route, navigation }: Props) {
  const model = getListingById(route.params.modelId);
  const hardware = useAppStore((s) => s.hardware);
  const installed = useAppStore((s) => s.installed);
  const wifiOnly = useSettingsStore((s) => s.wifiOnlyDownloads);
  const [busy, setBusy] = useState(false);
  const progress = useModelDownloadProgress(model?.id);

  const record = useMemo(
    () => installed.find((m) => m.listingId === route.params.modelId),
    [installed, route.params.modelId],
  );

  if (!model) {
    return (
      <View style={styles.container}>
        <Text>Model not found.</Text>
      </View>
    );
  }

  const compatibility = hardware ? canInstallModel(model, hardware) : { ok: true, reasons: [] };

  const download = async () => {
    if (!compatibility.ok) {
      Alert.alert('Incompatible', compatibility.reasons.join('\n'));
      return;
    }
    try {
      setBusy(true);
      await modelManager.downloadAndInstall(model, wifiOnly);
      Alert.alert(
        'Download complete',
        `${model.name} is installed. You can use it offline in Chat.`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Open Chat',
            onPress: () => navigation.getParent()?.navigate('ChatTab'),
          },
        ],
      );
    } catch (error) {
      Alert.alert('Download failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">{model.name}</Text>
      <Text variant="bodyMedium" style={styles.muted}>
        {model.author} · {model.license}
      </Text>
      <Text variant="bodyLarge" style={styles.body}>
        {model.description}
      </Text>

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.section}>
        Why this model
      </Text>
      <Text variant="bodyMedium" style={styles.body}>
        PocketBrain needs an on-device model for this capability. You can install several models at
        once, switch anytime, and delete any model to free storage — nothing is locked to a single
        download.
      </Text>

      <Divider style={styles.divider} />

      <Row label="Category" value={model.category} />
      <Row label="Format" value={model.format.toUpperCase()} />
      <Row label="Runtime" value={model.preferredRuntime} />
      <Row label="Download size" value={formatBytes(model.downloadSizeBytes)} />
      <Row label="Required RAM" value={formatBytes(model.requiredRamBytes)} />
      <Row label="Required storage" value={formatBytes(model.requiredStorageBytes)} />
      <Row label="Quantization" value={model.quantization} />
      <Row label="Parameters" value={model.parameterCount} />
      <Row label="Offline after install" value={model.offlineCapable ? 'Yes — no cloud required' : 'Limited'} />
      <Row
        label="Estimated speed"
        value={
          model.benchmarkTokensPerSec
            ? `~${model.benchmarkTokensPerSec} tok/s (device-dependent)`
            : 'Varies by phone CPU/GPU'
        }
      />
      <Row
        label="Battery impact"
        value={
          model.requiredRamBytes > 4_000_000_000
            ? 'Higher — prefer Wi‑Fi charging for long chats'
            : model.requiredRamBytes > 1_500_000_000
              ? 'Moderate on mid-range phones'
              : 'Lower — good for everyday use'
        }
      />
      <Row label="Quality / size tradeoff" value={`${model.quantization} · ${model.parameterCount}`} />
      <Row label="License" value={model.license} />
      <Row label="Author" value={model.author} />
      <Row
        label="Languages / tags"
        value={model.tags.length ? model.tags.join(', ') : 'General'}
      />
      <Row
        label="Devices"
        value={model.supportedPlatforms.map((p) => p.toUpperCase()).join(', ')}
      />
      <Row
        label="Installed status"
        value={
          record?.status === 'installed'
            ? `Installed · v${model.version ?? model.parameterCount}`
            : 'Not installed'
        }
      />

      {!compatibility.ok ? (
        <Text style={styles.warn}>{compatibility.reasons.join('\n')}</Text>
      ) : null}

      {progress ? <DownloadProgressBlock progress={progress} /> : null}

      <View style={styles.actions}>
        {record?.status === 'installed' ? (
          <>
            <Button mode="contained" onPress={() => navigation.getParent()?.navigate('ChatTab')}>
              Use in Chat
            </Button>
            <Button
              mode="outlined"
              textColor="#B91C1C"
              onPress={() =>
                Alert.alert('Delete model', 'Remove this model from the device?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => modelManager.delete(model.id),
                  },
                ])
              }
            >
              Delete anytime
            </Button>
          </>
        ) : (
          <Button mode="contained" loading={busy && !progress} disabled={Boolean(progress)} onPress={download}>
            {progress?.percent != null ? `Downloading ${progress.percent}%` : 'Download for offline use'}
          </Button>
        )}
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="labelLarge" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={{ flex: 1.4, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  muted: { opacity: 0.7, marginTop: 4 },
  body: { marginTop: 12 },
  section: { marginBottom: 4 },
  divider: { marginVertical: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  warn: { color: '#B91C1C', marginTop: 12 },
  actions: { marginTop: 24, gap: 12 },
});
