import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button, Searchbar, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AI_TASKS, type TaskId } from '../../../discover/tasks';
import type { HomeStackParamList } from '../../navigation/types';
import { modelManager } from '../../../services/ModelManager';
import { formatBytes } from '../../../utils/format';
import { useConsentStore } from '../../../privacy/consentStore';
import { BrandLogo } from '../../../components/BrandLogo';
import { LIST_PERF } from '../../../utils/listPerf';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 3 : 2;
  const installed = modelManager.list().filter((m) => m.status === 'installed');
  const pendingFirstTaskId = useConsentStore((s) => s.pendingFirstTaskId);
  const setConsent = useConsentStore((s) => s.setConsent);
  const [showAllTasks, setShowAllTasks] = useState(installed.length > 0);

  useEffect(() => {
    if (!pendingFirstTaskId) return;
    const taskId = pendingFirstTaskId as TaskId;
    setConsent('pendingFirstTaskId', null);
    navigation.navigate('TaskDetail', { taskId });
  }, [pendingFirstTaskId, navigation, setConsent]);

  const tasks = useMemo(() => {
    const all = AI_TASKS.filter((t) => !t.experimental || t.id === 'video');
    if (showAllTasks || installed.length > 0) return all;
    return all.filter((t) => t.beginner).slice(0, 4);
  }, [showAllTasks, installed.length]);

  const goGet = () => navigation.getParent()?.navigate('MarketplaceTab');
  const goChat = () => navigation.getParent()?.navigate('ChatTab');

  const header = (
    <View>
      <BrandLogo
        size={56}
        tagline={
          installed.length === 0
            ? 'Private AI on this phone — start with one small download.'
            : 'Your models stay on this device. Use them offline anytime.'
        }
      />

      <Searchbar
        placeholder="Search tasks, docs, models…"
        value=""
        onFocus={() => navigation.navigate('GlobalSearch')}
        onChangeText={() => navigation.navigate('GlobalSearch')}
        style={styles.search}
        accessibilityLabel="Open global search"
      />

      <View style={styles.statsRow}>
        <View
          style={[
            styles.statPill,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="cube-outline"
            size={18}
            color={theme.colors.primary}
          />
          <Text variant="labelLarge">
            {installed.length === 0
              ? 'No models yet'
              : `${installed.length} model${installed.length === 1 ? '' : 's'}`}
          </Text>
        </View>
        {installed.length > 0 ? (
          <Text variant="bodySmall" style={styles.muted}>
            {formatBytes(modelManager.totalStorageBytes())} used
          </Text>
        ) : null}
      </View>

      {installed.length === 0 ? (
        <View
          style={[
            styles.hero,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <Text variant="titleLarge" style={styles.heroTitle}>
            Start in 2 taps
          </Text>
          <Text variant="bodyMedium" style={styles.heroBody}>
            1) Download a small starter model{'\n'}
            2) Open Chat and ask anything
          </Text>
          <Text variant="bodySmall" style={styles.heroHint}>
            Works offline after download · Wi‑Fi or mobile data
          </Text>
          <Button
            mode="contained"
            icon="download"
            onPress={goGet}
            style={styles.heroBtn}
            contentStyle={styles.heroBtnContent}
          >
            Install your first model
          </Button>
        </View>
      ) : (
        <View style={styles.readyRow}>
          <Button
            mode="contained"
            icon="chat-processing"
            onPress={goChat}
            style={styles.readyPrimary}
            contentStyle={styles.heroBtnContent}
          >
            Open Chat
          </Button>
          <Button mode="outlined" onPress={goGet} style={styles.readySecondary}>
            Get models
          </Button>
        </View>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>
        {installed.length === 0 ? 'Popular things to do' : 'What do you want to do?'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 8) }]}>
      <FlatList
        {...LIST_PERF}
        data={tasks}
        key={`cols-${columns}`}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          <View style={styles.footer}>
            {!showAllTasks && installed.length === 0 ? (
              <Button mode="text" onPress={() => setShowAllTasks(true)}>
                Show more tasks
              </Button>
            ) : null}
            {installed.length > 0 ? (
              <View style={styles.secondaryLinks}>
                <Button
                  compact
                  mode="text"
                  icon="folder-outline"
                  onPress={() => navigation.navigate('Files')}
                >
                  Files
                </Button>
                <Button
                  compact
                  mode="text"
                  icon="harddisk"
                  onPress={() => navigation.navigate('Storage')}
                >
                  Storage
                </Button>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.subtitle}`}
            onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant ?? theme.colors.outline,
                flex: 1 / columns,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={26}
                color={theme.colors.primary}
              />
            </View>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {item.title}
            </Text>
            <Text variant="bodySmall" style={styles.muted} numberOfLines={2}>
              {item.subtitle}
            </Text>
            {item.experimental ? (
              <Text variant="labelSmall" style={{ color: theme.colors.tertiary, marginTop: 6 }}>
                Experimental
              </Text>
            ) : item.beginner ? (
              <Text variant="labelSmall" style={{ color: theme.colors.primary, marginTop: 6 }}>
                Easy start
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { marginTop: 14, marginBottom: 12 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    minHeight: 40,
  },
  muted: { opacity: 0.7 },
  hero: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  heroTitle: { fontWeight: '700' },
  heroBody: { marginTop: 8, marginBottom: 6, lineHeight: 22 },
  heroHint: { opacity: 0.75, marginBottom: 14 },
  heroBtn: { borderRadius: 14 },
  heroBtnContent: { minHeight: 48 },
  readyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  readyPrimary: { flex: 1, borderRadius: 14 },
  readySecondary: { borderRadius: 14 },
  sectionTitle: { marginBottom: 4, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 14,
    margin: 6,
    minHeight: 148,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { marginTop: 10 },
  footer: { paddingTop: 8, paddingBottom: 16, alignItems: 'center' },
  secondaryLinks: { flexDirection: 'row', gap: 4, marginTop: 4 },
});
