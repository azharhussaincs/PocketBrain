import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Chip, Searchbar, Text } from 'react-native-paper';
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
import { modelManager } from '../../../services/ModelManager';
import { modelRegistry } from '../../../ai/registry/ModelRegistry';
import { useAppStore } from '../../../store/appStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { useConsentStore } from '../../../privacy/consentStore';
import type { MarketplaceStackParamList } from '../../navigation/types';
import { t } from '../../../i18n/strings';
import { EmptyState } from '../../../components/EmptyState';
import { LIST_PERF } from '../../../utils/listPerf';

type Props = NativeStackScreenProps<MarketplaceStackParamList, 'MarketplaceHome'>;

const COLLECTIONS: Array<{ id: MarketplaceCollectionId; label: string }> = [
  { id: 'all', label: 'All models' },
  { id: 'recommended', label: 'Recommended' },
  { id: 'popular', label: 'Popular' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'coding', label: 'Coding' },
  { id: 'vision', label: 'Vision (Limited)' },
  { id: 'speech', label: 'Speech' },
  { id: 'translation', label: 'Translation' },
  { id: 'ocr', label: 'OCR' },
  { id: 'embeddings', label: 'Embeddings' },
  { id: 'offline', label: 'Offline' },
  { id: 'quality', label: 'Best quality' },
  { id: 'image', label: 'Image Gen' },
];

const SIZE_FILTERS: Array<{ id: ModelSizeTier | 'all'; label: string }> = [
  { id: 'all', label: 'Any size' },
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];

const SORTS: Array<{ id: DiscoverySort; label: string }> = [
  { id: 'recommended', label: 'Best for you' },
  { id: 'size_asc', label: 'Smallest first' },
  { id: 'size_desc', label: 'Largest first' },
  { id: 'ram_asc', label: 'Lowest RAM' },
];

export function MarketplaceScreen({ navigation }: Props) {
  const hardware = useAppStore((s) => s.hardware);
  const wifiOnly = useSettingsStore((s) => s.wifiOnlyDownloads);
  const offlineMode = useSettingsStore((s) => s.offlineMode);
  const language = useSettingsStore((s) => s.language);
  const allowDownloads = useConsentStore((s) => s.allowModelDownloads);
  const [collection, setCollection] = useState<MarketplaceCollectionId>('all');
  const [sizeTier, setSizeTier] = useState<ModelSizeTier | 'all'>('all');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [preferDeviceFit, setPreferDeviceFit] = useState(true);
  const [sort, setSort] = useState<DiscoverySort>('recommended');

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

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">{t('marketplace.title', language)}</Text>
      <Text variant="bodyMedium" style={styles.sub}>
        Browse all models — Small, Medium, and Large. Pick what fits your phone storage and RAM.
        Downloads work on Wi‑Fi or mobile data.
      </Text>
      <Searchbar
        placeholder="Search models…"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
        accessibilityLabel="Search marketplace models"
      />
      <Text variant="labelLarge" style={styles.sectionLabel}>
        Size
      </Text>
      <FlatList
        horizontal
        data={SIZE_FILTERS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        renderItem={({ item }) => (
          <Chip
            selected={sizeTier === item.id}
            onPress={() => setSizeTier(item.id)}
            style={styles.chip}
            compact
          >
            {item.label}
          </Chip>
        )}
      />
      <Text variant="labelLarge" style={styles.sectionLabel}>
        Category
      </Text>
      <FlatList
        horizontal
        data={COLLECTIONS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        renderItem={({ item }) => (
          <Chip
            selected={collection === item.id}
            onPress={() => setCollection(item.id)}
            style={styles.chip}
            compact
          >
            {item.label}
          </Chip>
        )}
      />
      <View style={styles.filterRow}>
        <Chip selected={preferDeviceFit} onPress={() => setPreferDeviceFit((v) => !v)} compact>
          Prefer fits this phone
        </Chip>
      </View>
      <FlatList
        horizontal
        data={SORTS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        renderItem={({ item }) => (
          <Chip
            selected={sort === item.id}
            onPress={() => setSort(item.id)}
            style={styles.chip}
            compact
          >
            {item.label}
          </Chip>
        )}
      />
      <Text variant="labelMedium" style={styles.count}>
        {data.length} model{data.length === 1 ? '' : 's'}
      </Text>
      <FlatList
        {...LIST_PERF}
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        ListEmptyComponent={
          <EmptyState
            title="No matching models"
            description="Try Size → Any size, or Category → All models."
          />
        }
        renderItem={({ item }) => (
          <View>
            <Text variant="labelSmall" style={styles.why}>
              {item.sizeTier.toUpperCase()} · {whyRecommended(item)}
            </Text>
            <FriendlyModelCard
              model={item}
              busy={busyId === item.id}
              primaryLabel={item.installed ? 'Installed' : 'Download'}
              onPress={() =>
                item.listing &&
                navigation.navigate('ModelDetail', { modelId: item.id })
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

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  sub: { opacity: 0.75, marginBottom: 10 },
  search: { marginBottom: 8 },
  sectionLabel: { marginBottom: 4, opacity: 0.85 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chips: { maxHeight: 44, marginBottom: 8 },
  chip: { marginRight: 6 },
  count: { opacity: 0.65, marginBottom: 6 },
  why: { opacity: 0.7, marginBottom: 4 },
  list: { paddingBottom: 32 },
});
