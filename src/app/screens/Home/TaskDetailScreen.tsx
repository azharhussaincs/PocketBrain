import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getTaskById, type TaskId } from '../../../discover/tasks';
import { recommendationsForTask } from '../../../discover/recommendations';
import { FriendlyModelCard } from '../../../components/FriendlyModelCard';
import { modelManager } from '../../../services/ModelManager';
import { modelRegistry } from '../../../ai/registry/ModelRegistry';
import { useAppStore } from '../../../store/appStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { useConsentStore } from '../../../privacy/consentStore';
import type { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'TaskDetail'>;

export function TaskDetailScreen({ route, navigation }: Props) {
  const task = getTaskById(route.params.taskId as TaskId);
  const hardware = useAppStore((s) => s.hardware);
  const wifiOnly = useSettingsStore((s) => s.wifiOnlyDownloads);
  const allowDownloads = useConsentStore((s) => s.allowModelDownloads);
  const [busyId, setBusyId] = useState<string | null>(null);

  const cards = useMemo(() => (task ? recommendationsForTask(task) : []), [task]);

  if (!task) {
    return (
      <View style={styles.container}>
        <Text>Task not found.</Text>
      </View>
    );
  }

  if (task.experimental) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall">{task.title}</Text>
        <Text style={styles.body}>{task.benefit}</Text>
        <Text style={styles.body}>
          Video AI is planned for a later phase and stays disabled until devices meet hardware
          requirements.
        </Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Back
        </Button>
      </ScrollView>
    );
  }

  const openTask = () => {
    const parent = navigation.getParent();
    if (task.playgroundMode) {
      parent?.navigate('PlaygroundTab');
    } else if (task.workspaceType) {
      parent?.navigate('WorkspaceTab');
    } else {
      parent?.navigate('ChatTab');
    }
  };

  const download = async (modelId: string) => {
    const card = cards.find((c) => c.id === modelId);
    if (!card?.listing) {
      // System engine — just open the feature
      openTask();
      return;
    }
    if (!allowDownloads) {
      Alert.alert('Downloads disabled', 'Enable model downloads in Settings → Privacy.');
      return;
    }
    const report = await modelRegistry.checkCompatibility(modelId, hardware);
    if (!report.ok) {
      Alert.alert('Not compatible', report.blockers.join('\n'));
      return;
    }
    const warnings = report.warnings.length ? `\n\n${report.warnings.join('\n')}` : '';
    Alert.alert(
      'Download recommended model',
      `${card.friendlyName}\nSize ${card.downloadSizeLabel} · RAM ${card.ramLabel}\nLicense: ${card.license}\n\nUses the internet once to save the model on this device.${warnings}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              setBusyId(modelId);
              await modelManager.downloadAndInstall(card.listing!, wifiOnly);
              Alert.alert('Ready', 'Model installed. You can use this task offline now.', [
                { text: 'Start', onPress: openTask },
              ]);
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

  const ready =
    cards.some((c) => c.installed) ||
    task.capability === 'speech' ||
    task.capability === 'tts' ||
    task.capability === 'ocr';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">{task.title}</Text>
      <Text variant="bodyLarge" style={styles.body}>
        {task.benefit}
      </Text>
      <Text variant="titleMedium" style={styles.section}>
        Recommended for your device
      </Text>
      <Text variant="bodySmall" style={styles.hint}>
        Plain-language picks first. Tap “Technical details” anytime.
      </Text>

      {cards.map((card) => (
        <FriendlyModelCard
          key={card.id}
          model={card}
          busy={busyId === card.id}
          primaryLabel={card.installed || !card.listing ? 'Use' : 'Download'}
          onPrimary={() => {
            if (card.installed || !card.listing) openTask();
            else void download(card.id);
          }}
          onPress={() => {
            if (card.listing) {
              navigation.getParent()?.navigate('MarketplaceTab', {
                screen: 'ModelDetail',
                params: { modelId: card.id },
              });
            }
          }}
        />
      ))}

      {ready ? (
        <Button mode="contained" onPress={openTask} style={{ marginTop: 8 }}>
          Continue to {task.title}
        </Button>
      ) : (
        <Text style={styles.hint}>Download one recommended model to get started.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  body: { marginTop: 8, lineHeight: 22, opacity: 0.9 },
  section: { marginTop: 20, marginBottom: 4 },
  hint: { opacity: 0.7, marginBottom: 12 },
});
