import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Searchbar, Text, useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  modelsInCollection,
  type MarketplaceCollectionId,
  type ModelSizeTier,
  type FriendlyModelCardData,
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
import { huggingFaceModelService } from '../../../services/HuggingFaceModelService';
import { useAppStore } from '../../../store/appStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { useConsentStore } from '../../../privacy/consentStore';
import type { MarketplaceStackParamList } from '../../navigation/types';
import { EmptyState } from '../../../components/EmptyState';
import { LIST_PERF } from '../../../utils/listPerf';
import { formatBytes } from '../../../utils/format';
import { downloadManager } from '../../../services/DownloadManager';
import type { ModelCapability, ModelListing } from '../../../types/models';

type Props = NativeStackScreenProps<MarketplaceStackParamList, 'MarketplaceHome'>;

const COLLECTIONS: Array<{ id: MarketplaceCollectionId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'recommended', label: 'For you' },
  { id: 'popular', label: 'Popular' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'coding', label: 'Coding' },
  { id: 'vision', label: 'Vision' },
  { id: 'image', label: 'Images' },
  { id: 'speech', label: 'Speech' },
  { id: 'translation', label: 'Translate' },
  { id: 'ocr', label: 'OCR' },
  { id: 'embeddings', label: 'Embed' },
  { id: 'offline', label: 'Offline' },
  { id: 'quality', label: 'Quality' },
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

function collectionToHfCapability(
  collection: MarketplaceCollectionId,
): ModelCapability | 'all' {
  switch (collection) {
    case 'coding':
      return 'coding';
    case 'vision':
      return 'vision';
    case 'image':
      return 'image_generation';
    case 'speech':
      return 'speech';
    case 'translation':
      return 'translation';
    case 'ocr':
      return 'ocr';
    case 'embeddings':
      return 'embeddings';
    default:
      return 'all';
  }
}

function cardsForCollection(collection: MarketplaceCollectionId) {
  let list = modelsInCollection(collection);
  if (collection !== 'speech' && collection !== 'ocr') {
    list = list.filter((m) => m.listing != null);
  }
  return list;
}

function emptyCopy(collection: MarketplaceCollectionId): { title: string; description: string } {
  switch (collection) {
    case 'vision':
      return {
        title: 'No vision models match',
        description:
          'Try Size → Any size, or wait for Hugging Face results. Vision understands photos.',
      };
    case 'speech':
      return {
        title: 'No speech engines match',
        description: 'Speech uses the built-in on-device recognizer (OCR/Speech chips).',
      };
    case 'ocr':
      return {
        title: 'No OCR engines match',
        description: 'OCR uses the built-in on-device text scanner.',
      };
    case 'coding':
      return {
        title: 'No coding models match',
        description: 'Try Size → Any size, or search “coder” above.',
      };
    case 'image':
      return {
        title: 'Looking for image models…',
        description:
          'Offline image *generation* needs a diffusion runtime (not linked yet). Browse listings for discovery, or use Vision to understand photos.',
      };
    default:
      return {
        title: 'No matching models',
        description: 'Try All, clear search, or check your network for Hugging Face browse.',
      };
  }
}

export function MarketplaceScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const hardware = useAppStore((s) => s.hardware);
  const wifiOnly = useSettingsStore((s) => s.wifiOnlyDownloads);
  const offlineMode = useSettingsStore((s) => s.offlineMode);
  const allowDownloads = useConsentStore((s) => s.allowModelDownloads);
  const [collection, setCollection] = useState<MarketplaceCollectionId>(
    route.params?.collection ?? 'all',
  );
  const [sizeTier, setSizeTier] = useState<ModelSizeTier | 'all'>('all');
  const [query, setQuery] = useState(route.params?.query ?? '');
  const [searchDraft, setSearchDraft] = useState(route.params?.query ?? '');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [preferDeviceFit, setPreferDeviceFit] = useState(false);
  const [sort, setSort] = useState<DiscoverySort>('recommended');
  const [filtersOpen, setFiltersOpen] = useState(Boolean(route.params?.collection));
  const [hfLoading, setHfLoading] = useState(false);
  const [hfError, setHfError] = useState<string | null>(null);
  const [catalogEpoch, setCatalogEpoch] = useState(0);

  useEffect(() => {
    if (route.params?.collection) {
      setCollection(route.params.collection);
      setSizeTier('all');
      setFiltersOpen(true);
    }
    if (route.params?.query) {
      setSearchDraft(route.params.query);
      setQuery(route.params.query);
    }
  }, [route.params?.collection, route.params?.query]);

  useEffect(() => {
    const t = setTimeout(() => setQuery(searchDraft.trim()), 450);
    return () => clearTimeout(t);
  }, [searchDraft]);

  useEffect(() => {
    if (!COLLECTIONS.some((c) => c.id === collection)) setCollection('all');
  }, [collection]);

  useEffect(() => {
    if (offlineMode) {
      setHfError('Offline mode is on — showing curated models saved in the app.');
      return;
    }
    let cancelled = false;
    (async () => {
      setHfLoading(true);
      setHfError(null);
      try {
        const cap = collectionToHfCapability(collection);
        const listings: ModelListing[] = query
          ? await huggingFaceModelService.search({ query, limit: 150, capability: cap })
          : cap === 'all'
            ? await huggingFaceModelService.browsePopular(150)
            : await huggingFaceModelService.browseForCapability(cap, 120);
        if (cancelled) return;
        void listings;
        setCatalogEpoch((e) => e + 1);
      } catch (error) {
        if (!cancelled) {
          setHfError(
            error instanceof Error
              ? error.message
              : 'Could not reach Hugging Face. Curated models still work.',
          );
        }
      } finally {
        if (!cancelled) setHfLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collection, query, offlineMode]);

  const collectionCounts = useMemo(() => {
    const counts: Partial<Record<MarketplaceCollectionId, number>> = {};
    for (const item of COLLECTIONS) {
      counts[item.id] = cardsForCollection(item.id).length;
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogEpoch]);

  const data = useMemo(() => {
    const list = cardsForCollection(collection);
    const effectiveSize =
      collection === 'speech' || collection === 'ocr' ? 'all' : sizeTier;
    return discoverModels(
      list,
      {
        query,
        sizeTier: effectiveSize,
        fitsDevice: preferDeviceFit,
        sort,
      },
      hardware,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, query, sizeTier, preferDeviceFit, sort, hardware, catalogEpoch]);

  const empty = emptyCopy(collection);
  const sizeLabel = SIZE_FILTERS.find((s) => s.id === sizeTier)?.label ?? 'Any size';
  const categoryLabel = COLLECTIONS.find((c) => c.id === collection)?.label ?? 'All';
  const sortLabel = SORTS.find((s) => s.id === sort)?.label ?? 'Best for you';
  const activeFilterSummary = [
    sizeLabel,
    preferDeviceFit ? 'Prefer fits phone' : null,
    categoryLabel,
    sortLabel,
    hfLoading ? 'Loading HF…' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const selectAndClose = (apply: () => void) => {
    apply();
    setFiltersOpen(false);
  };

  const confirmDownload = async (card: FriendlyModelCardData) => {
    if (!card.listing) return;
    const why = whyRecommended(card);
    const report = await modelRegistry.checkCompatibility(card.id, hardware);
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
              setBusyId(card.id);
              await modelManager.downloadAndInstall(card.listing!, wifiOnly);
              Alert.alert(
                'Download complete',
                `${card.friendlyName} is installed. Chat will auto-switch to it when this capability is needed.`,
                [
                  { text: 'Stay here', style: 'cancel' },
                  {
                    text: 'Open Chat',
                    onPress: () => navigation.getParent()?.navigate('ChatTab'),
                  },
                ],
              );
              setCatalogEpoch((e) => e + 1);
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
    if (card.listing.category === 'image' || card.listing.category === 'video') {
      Alert.alert(
        'Runtime not linked yet',
        'This Hugging Face package is listed for discovery, but PocketBrain cannot run image/video generators offline until a diffusion/video runtime is linked. Prefer Vision/Chat GGUF models for on-device use.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download anyway', onPress: () => void confirmDownload(card) },
        ],
      );
      return;
    }
    await confirmDownload(card);
  };

  const chipText = {
    color: theme.colors.onSurface,
    fontSize: width < 360 ? 12 : 13,
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Get models</Text>
      <Text variant="bodyMedium" style={styles.sub} numberOfLines={4}>
        Browse free Hugging Face GGUF models (chat, code, vision, and more). Download what you need —
        no artificial size cap. Chat auto-switches when an installed model matches your task.
      </Text>
      <Searchbar
        placeholder="Search Hugging Face + catalog…"
        value={searchDraft}
        onChangeText={setSearchDraft}
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

      {hfLoading ? (
        <View style={styles.hfRow}>
          <ActivityIndicator size="small" />
          <Text variant="bodySmall">Loading free models from Hugging Face…</Text>
        </View>
      ) : null}
      {hfError ? (
        <Text variant="bodySmall" style={styles.hfError}>
          {hfError}
        </Text>
      ) : null}

      {filtersOpen ? (
        <View style={styles.filterPanel}>
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Size (optional)
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
              Prefer fits phone
            </Chip>
          </View>

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Category
          </Text>
          <View style={styles.wrapRow}>
            {COLLECTIONS.map((item) => {
              const count = collectionCounts[item.id] ?? 0;
              return (
                <Chip
                  key={item.id}
                  selected={collection === item.id}
                  onPress={() =>
                    selectAndClose(() => {
                      setCollection(item.id);
                      setSizeTier('all');
                    })
                  }
                  style={styles.chip}
                  textStyle={chipText}
                  showSelectedOverlay
                  compact
                >
                  {item.id === 'all' ||
                  item.id === 'recommended' ||
                  item.id === 'popular' ||
                  item.id === 'beginner'
                    ? item.label
                    : `${item.label}${count ? ` (${count})` : ''}`}
                </Chip>
              );
            })}
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
        {hfLoading ? ' · updating…' : ''}
      </Text>
      <ActiveDownloadsHint />
      <FlatList
        {...LIST_PERF}
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        ListEmptyComponent={
          hfLoading ? (
            <EmptyState
              title="Loading models…"
              description="Fetching free GGUF listings from Hugging Face."
            />
          ) : (
            <EmptyState
              title={empty.title}
              description={empty.description}
              actionLabel="Show all models"
              onAction={() => {
                setCollection('all');
                setSizeTier('all');
                setSearchDraft('');
                setQuery('');
                setFiltersOpen(false);
              }}
            />
          )
        }
        renderItem={({ item }) => (
          <View>
            <Text variant="labelSmall" style={styles.why} numberOfLines={2}>
              {item.sizeTier.toUpperCase()} · {whyRecommended(item)}
              {item.listing?.tags?.includes('huggingface') ? ' · Hugging Face' : ''}
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
  hfRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  hfError: { opacity: 0.75, marginBottom: 8, color: '#B45309' },
});
