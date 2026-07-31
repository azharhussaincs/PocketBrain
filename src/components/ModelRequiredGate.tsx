import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import {
  gateForCapability,
  gateForPlayMode,
  type FeatureModelGate,
  type RecommendationTier,
} from '../discover/FeatureGate';
import { FriendlyModelCard } from './FriendlyModelCard';
import { modelManager } from '../services/ModelManager';
import { useSettingsStore } from '../store/settingsStore';
import { useConsentStore } from '../privacy/consentStore';
import type { ModelCapability } from '../types/models';

const TIER_LABEL: Record<RecommendationTier, string> = {
  best: 'Best Quality',
  fastest: 'Fastest',
  smallest: 'Smallest',
  beginner: 'Beginner Friendly',
};

interface Props {
  capability?: ModelCapability | 'system';
  playMode?: string;
  title?: string;
  onReady?: () => void;
  children?: React.ReactNode;
}

/**
 * Blocks a feature until a compatible model is installed, with one-tap recommendations.
 */
export function ModelRequiredGate({
  capability,
  playMode,
  title,
  onReady,
  children,
}: Props) {
  const wifiOnly = useSettingsStore((s) => s.wifiOnlyDownloads);
  const allowDownloads = useConsentStore((s) => s.allowModelDownloads);
  const offlineMode = useSettingsStore((s) => s.offlineMode);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const gate: FeatureModelGate = playMode
    ? gateForPlayMode(playMode)
    : gateForCapability(capability ?? 'chat');

  // tick forces re-read after install
  void tick;

  if (gate.ready) {
    return <>{children}</>;
  }

  const download = async (modelId: string) => {
    const card = gate.recommendations.find((r) => r.id === modelId);
    if (!card?.listing) {
      Alert.alert(
        'Not available yet',
        'No downloadable model is listed for this feature yet. Check Marketplace later or use a related text model where supported.',
      );
      return;
    }
    if (!allowDownloads) {
      Alert.alert('Downloads disabled', 'Enable model downloads in Settings → Privacy.');
      return;
    }
    if (offlineMode) {
      Alert.alert('Offline mode', 'Turn off Offline mode to download models.');
      return;
    }
    try {
      setBusyId(modelId);
      await modelManager.downloadAndInstall(card.listing, wifiOnly);
      setTick((t) => t + 1);
      onReady?.();
      Alert.alert('Ready', `${card.friendlyName} installed. You can use this feature offline now.`);
    } catch (error) {
      Alert.alert('Download failed', error instanceof Error ? error.message : 'Error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">{title ?? 'Model required'}</Text>
      <Text variant="bodyLarge" style={styles.message}>
        {gate.message}
      </Text>
      <Text variant="titleMedium" style={styles.section}>
        Recommended
      </Text>
      {!gate.recommendations.length ? (
        <Text style={styles.hint}>
          No catalog models for this capability yet. Browse Marketplace or pick another task.
        </Text>
      ) : (
        gate.recommendations.map((card) => (
          <View key={`${card.tier}-${card.id}`}>
            <Text variant="labelLarge" style={styles.tier}>
              {TIER_LABEL[card.tier]}
            </Text>
            <FriendlyModelCard
              model={card}
              busy={busyId === card.id}
              primaryLabel="Install"
              onPrimary={() => void download(card.id)}
            />
          </View>
        ))
      )}
      <Button mode="outlined" onPress={() => setTick((t) => t + 1)}>
        Refresh
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8, paddingBottom: 24 },
  message: { marginTop: 8, marginBottom: 16, lineHeight: 22 },
  section: { marginBottom: 8 },
  tier: { marginBottom: 4, opacity: 0.8 },
  hint: { opacity: 0.7, marginBottom: 16 },
});
