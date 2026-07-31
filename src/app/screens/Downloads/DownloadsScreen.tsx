import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, ProgressBar, SegmentedButtons, Text } from 'react-native-paper';
import { useAppStore } from '../../../store/appStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { downloadManager } from '../../../services/DownloadManager';
import { appStorageManager } from '../../../storage/AppStorageManager';
import { formatBytes, formatEta, formatSpeed } from '../../../utils/format';
import type { DownloadJob, DownloadState } from '../../../types/models';
import { EmptyState } from '../../../components/EmptyState';
import { LIST_PERF } from '../../../utils/listPerf';

type Filter =
  | 'all'
  | 'active'
  | 'queued'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'history';

function matches(job: DownloadJob, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'failed') return job.state === 'error' || job.state === 'cancelled';
  if (filter === 'history') {
    return (
      job.state === 'completed' ||
      job.state === 'error' ||
      job.state === 'cancelled'
    );
  }
  if (filter === 'active') return job.state === 'active' || job.state === 'verifying';
  return job.state === filter;
}

export function DownloadsScreen() {
  const downloads = useAppStore((s) => s.downloads);
  const wifiOnly = useSettingsStore((s) => s.wifiOnlyDownloads);
  const [filter, setFilter] = useState<Filter>('all');
  const freeDisk = useMemo(
    () => appStorageManager.getBreakdown().freeDiskBytes,
    [downloads],
  );

  const filtered = useMemo(
    () => downloads.filter((d) => matches(d, filter)),
    [downloads, filter],
  );

  const counts = useMemo(() => {
    const c = {
      active: 0,
      queued: 0,
      paused: 0,
      completed: 0,
      failed: 0,
    };
    for (const d of downloads) {
      if (d.state === 'active' || d.state === 'verifying') c.active += 1;
      else if (d.state === 'queued') c.queued += 1;
      else if (d.state === 'paused') c.paused += 1;
      else if (d.state === 'completed') c.completed += 1;
      else if (d.state === 'error' || d.state === 'cancelled') c.failed += 1;
    }
    return c;
  }, [downloads]);

  const estimateRemaining = filtered
    .filter((d) => d.state === 'active' || d.state === 'queued' || d.state === 'paused')
    .reduce((sum, d) => sum + Math.max(d.totalBytes - d.bytesWritten, 0), 0);

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Download Center</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Queue survives restarts. Integrity verified when a checksum is provided.
      </Text>
      <Text variant="bodySmall" style={styles.meta}>
        {wifiOnly ? 'Wi‑Fi preferred' : 'Mobile data allowed'} · Free:{' '}
        {freeDisk != null ? formatBytes(freeDisk) : '—'}
        {estimateRemaining > 0 ? ` · Need ~${formatBytes(estimateRemaining)}` : ''}
      </Text>
      {!wifiOnly ? (
        <Text variant="bodySmall" style={styles.warn}>
          Mobile data warning: large models can use significant cellular data.
        </Text>
      ) : null}

      <SegmentedButtons
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        density="small"
        style={styles.segments}
        buttons={[
          { value: 'all', label: 'All' },
          { value: 'active', label: `Live ${counts.active}` },
          { value: 'paused', label: `Pause ${counts.paused}` },
        ]}
      />
      <SegmentedButtons
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        density="small"
        style={styles.segments}
        buttons={[
          { value: 'queued', label: `Queue ${counts.queued}` },
          { value: 'completed', label: `Done ${counts.completed}` },
          { value: 'failed', label: `Fail ${counts.failed}` },
          { value: 'history', label: 'History' },
        ]}
      />

      <FlatList
        {...LIST_PERF}
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No downloads here"
            description="Queued, active, paused, completed, and failed jobs appear in their sections."
          />
        }
        renderItem={({ item }) => <DownloadRow job={item} />}
      />
    </View>
  );
}

function DownloadRow({ job }: { job: DownloadJob }) {
  const progress =
    job.totalBytes > 0 ? Math.min(job.bytesWritten / job.totalBytes, 1) : 0;
  const bps = downloadManager.getBytesPerSecond(job.id);
  const remaining = Math.max(job.totalBytes - job.bytesWritten, 0);
  const stateLabel = stateTitle(job.state);

  return (
    <View style={styles.card}>
      <Text variant="titleMedium">{job.modelName}</Text>
      <Text variant="bodySmall" style={styles.meta}>
        {stateLabel} · {formatBytes(job.bytesWritten)}
        {job.totalBytes ? ` / ${formatBytes(job.totalBytes)}` : ''}
      </Text>
      {job.state === 'active' ? (
        <Text variant="bodySmall" style={styles.meta}>
          {formatSpeed(bps)} · ETA {formatEta(remaining, bps)} · Left{' '}
          {formatBytes(remaining)}
        </Text>
      ) : null}
      {(job.state === 'active' || job.state === 'paused' || job.state === 'verifying') && (
        <ProgressBar progress={progress} style={styles.bar} />
      )}
      {job.error ? (
        <Text variant="bodySmall" style={styles.error}>
          {job.error}
        </Text>
      ) : null}
      <View style={styles.actions}>
        {job.state === 'active' ? (
          <Button
            compact
            mode="outlined"
            accessibilityLabel={`Pause download of ${job.modelName}`}
            onPress={() => downloadManager.pause(job.id)}
          >
            Pause
          </Button>
        ) : null}
        {job.state === 'paused' ? (
          <Button
            compact
            mode="outlined"
            accessibilityLabel={`Resume download of ${job.modelName}`}
            onPress={() => downloadManager.resume(job.id)}
          >
            Resume
          </Button>
        ) : null}
        {job.state === 'error' || job.state === 'cancelled' ? (
          <Button
            compact
            mode="outlined"
            accessibilityLabel={`Retry download of ${job.modelName}`}
            onPress={() => downloadManager.retry(job.id)}
          >
            Retry
          </Button>
        ) : null}
        {job.state === 'active' || job.state === 'paused' || job.state === 'queued' ? (
          <Button
            compact
            textColor="#B91C1C"
            accessibilityLabel={`Cancel download of ${job.modelName}`}
            onPress={() => downloadManager.cancel(job.id)}
          >
            Cancel
          </Button>
        ) : null}
      </View>
    </View>
  );
}

function stateTitle(state: DownloadState): string {
  const labels: Record<DownloadState, string> = {
    active: 'DOWNLOADING',
    verifying: 'VERIFYING',
    queued: 'QUEUED',
    paused: 'PAUSED',
    completed: 'COMPLETED',
    cancelled: 'CANCELLED',
    error: 'FAILED',
  };
  return labels[state] ?? String(state).toUpperCase();
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  subtitle: { opacity: 0.7, marginBottom: 6 },
  segments: { marginBottom: 8 },
  list: { paddingBottom: 32 },
  empty: { marginTop: 48, textAlign: 'center', opacity: 0.7 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  meta: { opacity: 0.7, marginTop: 4 },
  warn: { color: '#B45309', marginBottom: 8, marginTop: 4 },
  bar: { marginTop: 12, height: 8, borderRadius: 8 },
  error: { color: '#B91C1C', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
