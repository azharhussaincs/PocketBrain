import React, { useEffect, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button, Searchbar, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AI_TASKS, type TaskId } from '../../../discover/tasks';
import type { HomeStackParamList } from '../../navigation/types';
import { modelManager } from '../../../services/ModelManager';
import { formatBytes } from '../../../utils/format';
import { useConsentStore } from '../../../privacy/consentStore';
import { LIST_PERF } from '../../../utils/listPerf';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 3 : width >= 600 ? 2 : 2;
  const installed = modelManager.list().filter((m) => m.status === 'installed');
  const pendingFirstTaskId = useConsentStore((s) => s.pendingFirstTaskId);
  const setConsent = useConsentStore((s) => s.setConsent);

  useEffect(() => {
    if (!pendingFirstTaskId) return;
    const taskId = pendingFirstTaskId as TaskId;
    setConsent('pendingFirstTaskId', null);
    navigation.navigate('TaskDetail', { taskId });
  }, [pendingFirstTaskId, navigation, setConsent]);

  const tasks = useMemo(
    () => AI_TASKS.filter((t) => !t.experimental || t.id === 'video'),
    [],
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" accessibilityRole="header">
        What do you want to do?
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        PocketBrain runs AI on your phone. Download only what you need — then use it offline.
      </Text>

      <Searchbar
        placeholder="Search tasks, docs, models…"
        value=""
        onFocus={() => navigation.navigate('GlobalSearch')}
        onChangeText={() => navigation.navigate('GlobalSearch')}
        style={styles.search}
        accessibilityLabel="Open global search"
      />

      <View style={styles.stats}>
        <Text variant="labelLarge">{installed.length} models installed</Text>
        <Text variant="bodySmall" style={styles.muted}>
          {formatBytes(modelManager.totalStorageBytes())} used
        </Text>
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
          <Text variant="titleMedium">Start in 2 steps</Text>
          <Text variant="bodyMedium" style={styles.heroBody}>
            1) Download a small model · 2) Open Chat and ask anything. Works offline after download.
          </Text>
          <Button
            mode="contained"
            icon="download"
            onPress={() => navigation.getParent()?.navigate('MarketplaceTab')}
            style={styles.heroBtn}
          >
            Install your first model
          </Button>
          <Button mode="text" onPress={() => navigation.getParent()?.navigate('ChatTab')}>
            Go to Chat
          </Button>
        </View>
      ) : null}

      <FlatList
        {...LIST_PERF}
        data={tasks}
        key={`cols-${columns}`}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.subtitle}`}
            onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant ?? theme.colors.outline,
                flex: 1 / columns,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={28}
              color={theme.colors.primary}
            />
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
                Beginner friendly
              </Text>
            ) : null}
          </Pressable>
        )}
      />

      <View style={styles.footerActions}>
        {installed.length > 0 ? (
          <Button
            mode="contained"
            onPress={() => navigation.getParent()?.navigate('ChatTab')}
          >
            Open Chat
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={() => navigation.getParent()?.navigate('MarketplaceTab')}
          >
            Browse models
          </Button>
        )}
        <Button mode="outlined" onPress={() => navigation.navigate('Files')}>
          Files
        </Button>
        <Button mode="outlined" onPress={() => navigation.navigate('Storage')}>
          Storage
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  subtitle: { opacity: 0.75, marginBottom: 12 },
  search: { marginBottom: 10 },
  stats: { marginBottom: 8 },
  muted: { opacity: 0.7 },
  hero: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  heroBody: { marginTop: 6, marginBottom: 10, opacity: 0.9 },
  heroBtn: { marginBottom: 4 },
  list: { paddingBottom: 100 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    margin: 6,
    minHeight: 140,
  },
  cardTitle: { marginTop: 8 },
  footerActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
});
