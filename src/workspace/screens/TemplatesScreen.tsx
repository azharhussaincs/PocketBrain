import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { workspaceService } from '../services/WorkspaceService';
import type { TemplateCategory } from '../types/document';
import type { WorkspaceStackParamList } from '../../app/navigation/types';
import { LIST_PERF } from '../../utils/listPerf';

type Props = NativeStackScreenProps<WorkspaceStackParamList, 'Templates'>;

const CATEGORIES: Array<{ id: TemplateCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'business', label: 'Business' },
  { id: 'academic', label: 'Academic' },
  { id: 'personal', label: 'Personal' },
  { id: 'software', label: 'Software' },
  { id: 'finance', label: 'Finance' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'legal', label: 'Legal' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'education', label: 'Education' },
];

export function TemplatesScreen({ navigation }: Props) {
  const theme = useTheme();
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const templates = useMemo(
    () => workspaceService.listTemplates(category),
    [category],
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Templates</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Start from a professional structure, then refine with local AI.
      </Text>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        renderItem={({ item }) => (
          <Chip
            selected={category === item.id}
            onPress={() => setCategory(item.id)}
            style={styles.chip}
            compact
          >
            {item.label}
          </Chip>
        )}
      />

      <FlatList
        {...LIST_PERF}
        data={templates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant ?? theme.colors.outline,
              },
            ]}
          >
            <Text variant="titleMedium">{item.name}</Text>
            <Text variant="bodySmall" style={styles.meta}>
              {item.category} · {item.type}
            </Text>
            <Text variant="bodyMedium" style={styles.desc}>
              {item.description}
            </Text>
            <View style={styles.actions}>
              <Button
                mode="contained"
                compact
                onPress={async () => {
                  const doc = await workspaceService.createFromTemplate(item.id);
                  navigation.replace('DocumentEditor', { documentId: doc.id });
                }}
              >
                Use template
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() =>
                  navigation.navigate('AICreator', {
                    templateId: item.id,
                    type: item.type,
                    initialPrompt: item.promptHint,
                  })
                }
              >
                AI fill
              </Button>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  subtitle: { opacity: 0.7, marginBottom: 8 },
  chips: { maxHeight: 44, marginBottom: 8 },
  chip: { marginRight: 6 },
  list: { paddingBottom: 48 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  meta: { opacity: 0.65, marginTop: 4 },
  desc: { marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
