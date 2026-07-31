import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressBar, Text, useTheme } from 'react-native-paper';
import type { DownloadUiProgress } from '../hooks/useModelDownloadProgress';

type Props = {
  progress: DownloadUiProgress;
};

/** Inline progress for marketplace / install cards. */
export function DownloadProgressBlock({ progress }: Props) {
  const theme = useTheme();
  const indeterminate =
    progress.job.state === 'queued' ||
    progress.job.state === 'verifying' ||
    progress.job.totalBytes <= 0;

  return (
    <View
      style={[styles.wrap, { backgroundColor: theme.colors.primaryContainer }]}
      accessibilityRole="progressbar"
      accessibilityLabel={progress.label}
      accessibilityValue={
        progress.percent != null ? { now: progress.percent, min: 0, max: 100 } : undefined
      }
    >
      <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
        {progress.label}
      </Text>
      <ProgressBar
        progress={indeterminate ? undefined : progress.ratio}
        indeterminate={indeterminate}
        color={theme.colors.primary}
        style={styles.bar}
      />
      <Text variant="bodySmall" style={styles.detail}>
        {progress.detail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  bar: { height: 8, borderRadius: 4 },
  detail: { opacity: 0.8 },
});
