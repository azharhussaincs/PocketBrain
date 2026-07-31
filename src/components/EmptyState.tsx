import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  accessibilityLabel?: string;
}

/** Shared empty / offline / unfinished-feel reducer for release polish. */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  accessibilityLabel,
}: EmptyStateProps) {
  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel ?? `${title}. ${description ?? ''}`}
    >
      <Text variant="titleMedium">{title}</Text>
      {description ? (
        <Text variant="bodyMedium" style={styles.desc}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          mode="contained-tonal"
          onPress={onAction}
          style={styles.btn}
          contentStyle={styles.btnContent}
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
        >
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 28,
    paddingHorizontal: 8,
    gap: 8,
    alignItems: 'flex-start',
  },
  desc: { opacity: 0.75 },
  btn: { marginTop: 8 },
  btnContent: { minHeight: 44, paddingHorizontal: 8 },
});
