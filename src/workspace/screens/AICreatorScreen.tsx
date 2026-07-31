import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { workspaceService } from '../services/WorkspaceService';
import type { WorkspaceDocType } from '../types/document';
import type { WorkspaceStackParamList } from '../../app/navigation/types';

type Props = NativeStackScreenProps<WorkspaceStackParamList, 'AICreator'>;

const TYPES: Array<{ value: string; label: string }> = [
  { value: 'document', label: 'Doc' },
  { value: 'presentation', label: 'Slides' },
  { value: 'spreadsheet', label: 'Sheet' },
  { value: 'pdf', label: 'PDF' },
  { value: 'markdown', label: 'MD' },
];

const PROMPT_CHIPS = [
  'Write my resume',
  'Create an invoice',
  'Make a project proposal',
  'Generate a business report',
  'Write a legal agreement',
  'Create lecture notes',
  'Make an assignment',
  'Create meeting minutes',
  'Build software documentation',
  'Create API documentation',
];

export function AICreatorScreen({ navigation, route }: Props) {
  const [prompt, setPrompt] = useState(route.params?.initialPrompt ?? '');
  const [type, setType] = useState<string>(route.params?.type ?? 'document');
  const [busy, setBusy] = useState(false);
  const [stream, setStream] = useState('');

  const hint = useMemo(() => {
    switch (type) {
      case 'presentation':
        return 'Generates slides, bullets, speaker notes, and optional chart structure.';
      case 'spreadsheet':
        return 'Generates tables for budgets, invoices, reports, and schedules.';
      case 'pdf':
        return 'Generates a print-oriented report exported with headers, footers, and page numbers.';
      default:
        return 'Generates a structured document you can edit and export to DOCX/PDF/MD/HTML.';
    }
  }, [type]);

  const create = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setStream('');
    try {
      const doc = await workspaceService.createWithAI({
        prompt: prompt.trim(),
        type: type as WorkspaceDocType,
        templateId: route.params?.templateId,
        onToken: (token) => setStream((prev) => prev + token),
      });
      navigation.replace('DocumentEditor', { documentId: doc.id });
    } catch (error) {
      setStream(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">AI Document Creator</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Local generation only. {hint}
      </Text>

      <SegmentedButtons value={type} onValueChange={setType} buttons={TYPES} />

      <TextInput
        mode="outlined"
        multiline
        numberOfLines={6}
        label="What should PocketBrain create?"
        value={prompt}
        onChangeText={setPrompt}
        style={styles.input}
      />

      <View style={styles.chips}>
        {PROMPT_CHIPS.map((chip) => (
          <Button key={chip} compact mode="outlined" onPress={() => setPrompt(chip)}>
            {chip}
          </Button>
        ))}
      </View>

      <Button mode="contained" loading={busy} onPress={create} disabled={!prompt.trim()}>
        Generate locally
      </Button>

      {stream ? (
        <View style={styles.stream}>
          <Text variant="titleSmall">Model stream</Text>
          <Text>{stream}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48, gap: 12 },
  subtitle: { opacity: 0.7 },
  input: { minHeight: 140 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stream: { marginTop: 12, gap: 6 },
});
