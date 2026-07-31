import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, useTheme } from 'react-native-paper';
import type { FriendlyModelCardData } from '../discover/recommendations';
import { useModelDownloadProgress } from '../hooks/useModelDownloadProgress';
import { DownloadProgressBlock } from './DownloadProgressBlock';

interface Props {
  model: FriendlyModelCardData;
  onPress?: () => void;
  onPrimary?: () => void;
  primaryLabel?: string;
  showTechnical?: boolean;
  busy?: boolean;
  /** Compact card for first-time install surfaces */
  simple?: boolean;
}

const PRIMARY_BADGES = new Set([
  'Small',
  'Medium',
  'Large',
  'Beginner Friendly',
  'Recommended',
  'Fast',
]);

export function FriendlyModelCard({
  model,
  onPress,
  onPrimary,
  primaryLabel,
  showTechnical,
  busy,
  simple = true,
}: Props) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(Boolean(showTechnical));
  const progress = useModelDownloadProgress(model.id);
  const downloading = Boolean(progress) || busy;

  const badges = simple
    ? model.badges.filter((b) => PRIMARY_BADGES.has(b)).slice(0, 3)
    : model.badges;

  const buttonLabel = progress
    ? progress.percent != null
      ? `${progress.percent}%`
      : progress.job.state === 'verifying'
        ? 'Checking…'
        : 'Downloading…'
    : (primaryLabel ?? (model.installed ? 'Open' : 'Download'));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${model.friendlyName}. ${model.purpose}`}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant ?? theme.colors.outline,
        },
      ]}
    >
      <Text variant="titleMedium">{model.friendlyName}</Text>
      <Text variant="bodyMedium" style={styles.purpose} numberOfLines={2}>
        {model.purpose}
      </Text>

      {badges.length ? (
        <View style={styles.badges}>
          {badges.map((badge) => (
            <Chip key={badge} compact style={styles.badge}>
              {badge}
            </Chip>
          ))}
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <Meta label="Download" value={model.downloadSizeLabel} />
        <Meta label="RAM need" value={model.ramLabel} />
        <Meta label="Speed" value={model.speed} />
      </View>

      {(expanded || !simple) && (
        <View style={styles.metaRow}>
          <Meta label="Quality" value={model.quality} />
          <Meta label="Battery" value={model.batteryImpact} />
          <Meta label="Offline" value={model.offline ? 'Yes' : 'No'} />
        </View>
      )}

      {progress ? <DownloadProgressBlock progress={progress} /> : null}

      <View style={styles.actions}>
        {onPrimary ? (
          <Button
            mode="contained"
            loading={downloading && !progress}
            disabled={Boolean(progress)}
            onPress={onPrimary}
            style={styles.primaryBtn}
            contentStyle={styles.primaryBtnContent}
            icon={model.installed ? 'check' : 'download'}
          >
            {buttonLabel}
          </Button>
        ) : null}
        <Button compact mode="text" onPress={() => setExpanded((v) => !v)}>
          {expanded ? 'Less' : 'More info'}
        </Button>
      </View>

      {expanded && (
        <View style={styles.tech}>
          <Text variant="bodySmall">Name: {model.technicalName}</Text>
          <Text variant="bodySmall">Author: {model.author}</Text>
          <Text variant="bodySmall">License: {model.license}</Text>
          <Text variant="bodySmall">Quantization: {model.quantization}</Text>
          <Text variant="bodySmall">Runtime: {model.runtime}</Text>
        </View>
      )}
    </Pressable>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.meta}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="labelLarge">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  purpose: { marginTop: 4, opacity: 0.85 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  badge: { marginRight: 0 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  meta: { minWidth: 72 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  primaryBtn: { flexGrow: 1, borderRadius: 12 },
  primaryBtnContent: { minHeight: 44 },
  tech: { marginTop: 10, gap: 2, opacity: 0.75 },
});
