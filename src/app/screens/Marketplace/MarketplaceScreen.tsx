import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Chip, Searchbar, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  modelsInCollection,
  type MarketplaceCollectionId,
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
  { id: 'recommended', label: 'Recommended' },
  { id: 'popular', label: 'Popular' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'fast', label: 'Fast' },
  { id: 'small', label: 'Small' },
  { id: 'quality', label: 'Best Quality' },
  { id: 'offline', label: 'Offline Essentials' },
  { id: 'coding', label: 'Coding' },
  { id: 'vision', label: 'Vision (Limited)' },
  { id: 'speech', label: 'Speech' },
  { id: 'image', label: 'Image Gen' },
  { id: 'translation', label: 'Translation' },
  { id: 'ocr', label: 'OCR' },
  { id: 'embeddings', label: 'Embeddings' },
];

const SORTS: Array<{ id: DiscoverySort; label: string }> = [
  { id: 'recommended', label: 'Why recommended' },
  { id: 'size_asc', label: 'Smallest' },
  { id: 'ram_asc', label: 'Lowest RAM' },
  { id: 'author', label: 'Author' },
  { id: 'license', label: 'License' },
];

export function MarketplaceScreen({ navigation }: Props) {
  const hardware = useAppStore((s) => s.hardware);
  const wifiOnly = useSettingsStore((s) => s.wifiOnlyDownloads);
  const offlineMode = useSettingsStore((s) => s.offlineMode);
  const language = useSettingsStore((s) => s.language);
  const allowDownloads = useConsentStore((s) => s.allowModelDownloads);
  const [collection, setCollection] = useState<MarketplaceCollectionId>('recommended');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [fitsDevice, setFitsDevice] = useState(true);
  const [offlineOnly, setOfflineOnly] = useState(false);
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
        offlineOnly,
        fitsDevice,
        sort,
      },
      hardware,
    );
  }, [collection, query, offlineOnly, fitsDevice, sort, hardware]);

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
      Alert.alert('Not compatible', report.blockers.join('\n'));
      return;
    }
    const why = whyRecommended(card);
    const warnings = report.warnings.length ? `\n\n${report.warnings.join('\n')}` : '';
    Alert.alert(
      'Download model',
      `${card.friendlyName}\n${card.downloadSizeLabel} · RAM ${card.ramLabel}\nLicense: ${card.license}\nAuthor: ${card.author}\n\nWhy recommended: ${why}\n\nDownloads over the internet to this device only.${warnings}`,
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
        {t('marketplace.subtitle', language)} Discover by task, size, RAM, license, and device fit.
      </Text>
      <Searchbar
        placeholder="Search by name, author, license, language…"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
        accessibilityLabel="Search marketplace models"
      />
      <View style={styles.filterRow}>
        <Chip selected={fitsDevice} onPress={() => setFitsDevice((v) => !v)} compact>
          Fits this device
        </Chip>
        <Chip selected={offlineOnly} onPress={() => setOfflineOnly((v) => !v)} compact>
          Offline
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
      <FlatList
        {...LIST_PERF}
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        initialNumToRender={6}
        ListEmptyComponent={
          <EmptyState
            title="No matching models"
            description="Try clearing filters or searching by name, author, or license."
          />
        }
        renderItem={({ item }) => (
          <View>
            <Text variant="labelSmall" style={styles.why}>
              {whyRecommended(item)}
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
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chips: { maxHeight: 44, marginBottom: 8 },
  chip: { marginRight: 6 },
  why: { opacity: 0.7, marginBottom: 4 },
  list: { paddingBottom: 32 },
  empty: { textAlign: 'center', marginTop: 48, opacity: 0.7 },
});
