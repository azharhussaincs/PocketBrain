import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, useTheme } from 'react-native-paper';
import type { FriendlyModelCardData } from '../discover/recommendations';

interface Props {
  model: FriendlyModelCardData;
  onPress?: () => void;
  onPrimary?: () => void;
  primaryLabel?: string;
  showTechnical?: boolean;
  busy?: boolean;
}

export function FriendlyModelCard({
  model,
  onPress,
  onPrimary,
  primaryLabel,
  showTechnical,
  busy,
}: Props) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

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
      <Text variant="bodyMedium" style={styles.purpose}>
        {model.purpose}
      </Text>

      <View style={styles.badges}>
        {model.badges.map((badge) => (
          <Chip key={badge} compact style={styles.badge}>
            {badge}
          </Chip>
        ))}
      </View>

      <View style={styles.metaRow}>
        <Meta label="Size" value={model.downloadSizeLabel} />
        <Meta label="RAM" value={model.ramLabel} />
        <Meta label="Speed" value={model.speed} />
        <Meta label="Quality" value={model.quality} />
      </View>
      <View style={styles.metaRow}>
        <Meta label="Battery" value={model.batteryImpact} />
        <Meta label="Offline" value={model.offline ? 'Yes' : 'No'} />
        <Meta label="Storage" value={model.storageImpact} />
      </View>

      <View style={styles.actions}>
        {onPrimary ? (
          <Button mode="contained" compact loading={busy} onPress={onPrimary}>
            {primaryLabel ?? (model.installed ? 'Open' : 'Download')}
          </Button>
        ) : null}
        <Button compact mode="text" onPress={() => setExpanded((v) => !v)}>
          {expanded || showTechnical ? 'Hide details' : 'Technical details'}
        </Button>
      </View>

      {(expanded || showTechnical) && (
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
  tech: { marginTop: 10, gap: 2, opacity: 0.75 },
});
