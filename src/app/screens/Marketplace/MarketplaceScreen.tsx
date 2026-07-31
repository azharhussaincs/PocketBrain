import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Chip, Searchbar, Text, useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  modelsInCollection,
  type MarketplaceCollectionId,
  type ModelSizeTier,
} from '../../../discover/recommendations';
import {
  discoverModels,
  whyRecommended,
  type DiscoverySort,
} from '../../../discover/discovery';
import { FriendlyModelCard } from '../../../components/FriendlyModelCard';
import { DownloadProgressBlock } from '../../../components/DownloadProgressBlock';
import { modelManager } from '../../../services/ModelManager';
import { modelRegistry } from '../../../ai/registry/ModelRegistry';
import { useAppStore } from '../../../store/appStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { useConsentStore } from '../../../privacy/consentStore';
import type { MarketplaceStackParamList } from '../../navigation/types';
import { EmptyState } from '../../../components/EmptyState';
import { LIST_PERF } from '../../../utils/listPerf';
import { formatBytes } from '../../../utils/format';
import { downloadManager } from '../../../services/DownloadManager';

type Props = NativeStackScreenProps<MarketplaceStackParamList, 'MarketplaceHome'>;

const COLLECTIONS: Array<{ id: MarketplaceCollectionId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'recommended', label: 'For you' },
  { id: 'popular', label: 'Popular' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'coding', label: 'Coding' },
  { id: 'vision', label: 'Vision' },
  { id: 'speech', label: 'Speech' },
  { id: 'translation', label: 'Translate' },
  { id: 'ocr', label: 'OCR' },
  { id: 'offline', label: 'Offline' },
  { id: 'quality', label: 'Quality' },
  { id: 'image', label: 'Images' },
];

const SIZE_FILTERS: Array<{ id: ModelSizeTier | 'all'; label: string }> = [
  { id: 'all', label: 'Any size' },
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];

const SORTS: Array<{ id: DiscoverySort; label: string }> = [
  { id: 'recommended', label: 'Best for you' },
  { id: 'size_asc', label: 'Smallest' },
  { id: 'size_desc', label: 'Largest' },
  { id: 'ram_asc', label: 'Low RAM' },
];

export function MarketplaceScreen({ navigation }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const hardware = useAppStore((s) => s.hardware);
  const wifiOnly = useSettingsStore((s) => s.wifiOnlyDownloads);
  const offlineMode = useSettingsStore((s) => s.offlineMode);
  const allowDownloads = useConsentStore((s) => s.allowModelDownloads);
  const [collection, setCollection] = useState<MarketplaceCollectionId>('all');
  const [sizeTier, setSizeTier] = useState<ModelSizeTier | 'all'>('all');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [preferDeviceFit, setPreferDeviceFit] = useState(true);
  const [sort, setSort] = useState<DiscoverySort>('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const data = useMemo(() => {
    let list = modelsInCollection(collection);
    if (collection !== 'speech' && collection !== 'ocr') {
      list = list.filter((m) => m.listing != null);
    }
    return discoverModels(
      list,
      {
        query,
        sizeTier,
        fitsDevice: preferDeviceFit,
        sort,
      },
      hardware,
    );
  }, [collection, query, sizeTier, preferDeviceFit, sort, hardware]);

  const sizeLabel = SIZE_FILTERS.find((s) => s.id === sizeTier)?.label ?? 'Any size';
  const categoryLabel = COLLECTIONS.find((c) => c.id === collection)?.label ?? 'All';
  const sortLabel = SORTS.find((s) => s.id === sort)?.label ?? 'Best for you';
  const activeFilterSummary = [
    sizeLabel,
    preferDeviceFit ? 'Fits phone' : null,
    categoryLabel,
    sortLabel,
  ]
    .filter(Boolean)
    .join(' · ');

  const selectAndClose = (apply: () => void) => {
    apply();
    setFiltersOpen(false);
  };

  const download = async (modelId: string) => {
    const card = data.find((d) => d.id === modelId);
    if (!card?.listing) return;
    if (!allowDownloads) {
      Alert.alert('Downloads disabled', 'Enable model downloads in Settings → Privacy.');
      return;
    }
    if (offlineMode) {
      Alert.alert('Offline mode', 'Turn off Offline mode to download.');
      return;
    }
    const report = await modelRegistry.checkCompatibility(modelId, hardware);
    if (!report.ok) {
      Alert.alert('Cannot download', report.blockers.join('\n'));
      return;
    }
    const why = whyRecommended(card);
    const warnings = report.warnings.length ? `\n\nNote: ${report.warnings.join(' ')}` : '';
    const netHint = wifiOnly
      ? '\n\nWi‑Fi only is on (Settings). Turn it off to use mobile data.'
      : '\n\nDownload uses Wi‑Fi or mobile data.';
    Alert.alert(
      'Download model',
      `${card.friendlyName} · ${card.sizeTier.toUpperCase()}\n${card.downloadSizeLabel} · RAM ${card.ramLabel}\nLicense: ${card.license}\n\n${why}\n\nSaved on this phone only.${warnings}${netHint}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              setBusyId(modelId);
              await modelManager.downloadAndInstall(card.listing!, wifiOnly);
              Alert.alert(
                'Download complete',
                `${card.friendlyName} is installed on this phone. You can use it offline in Chat.`,
                [
                  { text: 'Stay here', style: 'cancel' },
                  {
                    text: 'Open Chat',
                    onPress: () => navigation.getParent()?.navigate('ChatTab'),
                  },
                ],
              );
            } catch (error) {
              Alert.alert('Download failed', error instanceof Error ? error.message : 'Error');
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  const chipText = {
    color: theme.colors.onSurface,
    fontSize: width < 360 ? 12 : 13,
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Get models</Text>
      <Text variant="bodyMedium" style={styles.sub} numberOfLines={3}>
        Pick a size that fits your phone. Small is best for first install. Works on Wi‑Fi or mobile
        data.
      </Text>
      <Searchbar
        placeholder="Search models…"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
        accessibilityLabel="Search marketplace models"
      />

      <View style={styles.filterBar}>
        <Button
          mode={filtersOpen ? 'contained' : 'outlined'}
          icon="filter-variant"
          compact
          onPress={() => setFiltersOpen((v) => !v)}
          accessibilityLabel={filtersOpen ? 'Hide filters' : 'Show filters'}
        >
          {filtersOpen ? 'Hide filters' : 'Filter'}
        </Button>
        {!filtersOpen ? (
          <Text variant="bodySmall" style={styles.filterSummary} numberOfLines={2}>
            {activeFilterSummary}
          </Text>
        ) : (
          <Button compact mode="text" onPress={() => setFiltersOpen(false)}>
            Done
          </Button>
        )}
      </View>

      {filtersOpen ? (
        <View style={styles.filterPanel}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Size
          </Text>
          <View style={styles.wrapRow}>
            {SIZE_FILTERS.map((item) => (
              <Chip
                key={item.id}
                selected={sizeTier === item.id}
                onPress={() => selectAndClose(() => setSizeTier(item.id))}
                style={styles.chip}
                textStyle={chipText}
                showSelectedOverlay
                compact
              >
                {item.label}
              </Chip>
            ))}
            <Chip
              selected={preferDeviceFit}
              onPress={() => selectAndClose(() => setPreferDeviceFit((v) => !v))}
              style={styles.chip}
              textStyle={chipText}
              showSelectedOverlay
              compact
              icon={preferDeviceFit ? 'check' : undefined}
            >
              Fits phone
            </Chip>
          </View>

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Category
          </Text>
          <View style={styles.wrapRow}>
            {COLLECTIONS.map((item) => (
              <Chip
                key={item.id}
                selected={collection === item.id}
                onPress={() => selectAndClose(() => setCollection(item.id))}
                style={styles.chip}
                textStyle={chipText}
                showSelectedOverlay
                compact
              >
                {item.label}
              </Chip>
            ))}
          </View>

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Sort
          </Text>
          <View style={styles.wrapRow}>
            {SORTS.map((item) => (
              <Chip
                key={item.id}
                selected={sort === item.id}
                onPress={() => selectAndClose(() => setSort(item.id))}
                style={styles.chip}
                textStyle={chipText}
                showSelectedOverlay
                compact
              >
                {item.label}
              </Chip>
            ))}
          </View>
        </View>
      ) : null}

      <Text variant="labelMedium" style={styles.count}>
        {data.length} model{data.length === 1 ? '' : 's'}
      </Text>
      <ActiveDownloadsHint />
      <FlatList
        {...LIST_PERF}
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        ListEmptyComponent={
          <EmptyState
            title="No matching models"
            description="Tap Filter and try Size → Any size, or Category → All."
          />
        }
        renderItem={({ item }) => (
          <View>
            <Text variant="labelSmall" style={styles.why} numberOfLines={2}>
              {item.sizeTier.toUpperCase()} · {whyRecommended(item)}
            </Text>
            <FriendlyModelCard
              model={item}
              busy={busyId === item.id}
              primaryLabel={item.installed ? 'Installed' : 'Download'}
              onPress={() =>
                item.listing && navigation.navigate('ModelDetail', { modelId: item.id })
              }
              onPrimary={() => {
                if (item.installed) {
                  navigation.navigate('ModelDetail', { modelId: item.id });
                } else if (item.listing) {
                  void download(item.id);
                }
              }}
            />
          </View>
        )}
      />
    </View>
  );
}

function ActiveDownloadsHint() {
  const downloads = useAppStore((s) => s.downloads);
  const active = downloads.filter(
    (d) => d.state === 'active' || d.state === 'queued' || d.state === 'verifying',
  );
  if (!active.length) return null;

  return (
    <View style={styles.activeBox}>
      <Text variant="titleSmall">Downloading now</Text>
      {active.map((job) => {
        const progress = {
          job,
          ratio: job.totalBytes > 0 ? Math.min(job.bytesWritten / job.totalBytes, 1) : 0,
          percent:
            job.totalBytes > 0
              ? Math.min(100, Math.round((job.bytesWritten / job.totalBytes) * 100))
              : null,
          label:
            job.state === 'verifying'
              ? `Checking ${job.modelName}…`
              : job.totalBytes > 0
                ? `${job.modelName} · ${Math.min(100, Math.round((job.bytesWritten / job.totalBytes) * 100))}%`
                : `Downloading ${job.modelName}…`,
          detail: `${formatBytes(job.bytesWritten)}${
            job.totalBytes > 0 ? ` / ${formatBytes(job.totalBytes)}` : ''
          } · ${downloadManager.getBytesPerSecond(job.id) > 0 ? `${formatBytes(downloadManager.getBytesPerSecond(job.id))}/s` : '…'}`,
        };
        return <DownloadProgressBlock key={job.id} progress={progress} />;
      })}
      <Text variant="bodySmall" style={styles.activeHint} numberOfLines={2}>
        Keep this screen open (or check Settings → Downloads).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  sub: { opacity: 0.75, marginBottom: 10, lineHeight: 20 },
  search: { marginBottom: 10 },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  filterSummary: { flex: 1, opacity: 0.7, lineHeight: 18 },
  filterPanel: {
    marginBottom: 4,
  },
  sectionLabel: { marginBottom: 6, opacity: 0.85 },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  chip: { marginRight: 0 },
  count: { opacity: 0.65, marginBottom: 6 },
  why: { opacity: 0.7, marginBottom: 4, lineHeight: 16 },
  list: { paddingBottom: 40 },
  activeBox: { marginBottom: 12, gap: 4 },
  activeHint: { opacity: 0.7, marginTop: 4 },
});
