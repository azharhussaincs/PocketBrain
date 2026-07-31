import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import type { ContentBlock, DocumentBody, SlideContent, SpreadsheetData } from '../types/document';
import { plainFromSpans } from '../utils/blocks';
import type { EditorCommand } from './documentReducer';

interface Props {
  body: DocumentBody;
  dispatch: (command: EditorCommand) => void;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
}

export function RichDocumentEditor({
  body,
  dispatch,
  selectedBlockId,
  onSelectBlock,
}: Props) {
  const theme = useTheme();

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {body.slides ? (
        <SlidesEditor
          slides={body.slides}
          onChange={(slides) => dispatch({ type: 'setBody', body: { ...body, slides } })}
        />
      ) : null}

      {body.spreadsheet ? (
        <SheetEditor
          sheet={body.spreadsheet}
          onChange={(spreadsheet) =>
            dispatch({ type: 'setBody', body: { ...body, spreadsheet } })
          }
        />
      ) : null}

      {body.mermaidSource != null ? (
        <TextInput
          mode="outlined"
          label="Mermaid source"
          multiline
          value={body.mermaidSource}
          onChangeText={(mermaidSource) =>
            dispatch({ type: 'setBody', body: { ...body, mermaidSource } })
          }
          style={styles.area}
        />
      ) : null}

      {body.svgMarkup != null ? (
        <TextInput
          mode="outlined"
          label="SVG markup"
          multiline
          value={body.svgMarkup}
          onChangeText={(svgMarkup) =>
            dispatch({ type: 'setBody', body: { ...body, svgMarkup } })
          }
          style={styles.area}
        />
      ) : null}

      {body.htmlBody != null ? (
        <TextInput
          mode="outlined"
          label="HTML"
          multiline
          value={body.htmlBody}
          onChangeText={(htmlBody) =>
            dispatch({ type: 'setBody', body: { ...body, htmlBody } })
          }
          style={styles.area}
        />
      ) : null}

      {body.blocks.map((block) => (
        <BlockEditor
          key={block.id}
          block={block}
          selected={selectedBlockId === block.id}
          onSelect={() => onSelectBlock(block.id)}
          onChangeText={(text) =>
            dispatch({ type: 'setBlockText', blockId: block.id, text })
          }
          onToggleCheck={() =>
            dispatch({
              type: 'updateBlock',
              blockId: block.id,
              patch: { checked: !block.checked },
            })
          }
          onRemove={() => dispatch({ type: 'removeBlock', blockId: block.id })}
          onMove={(direction) =>
            dispatch({ type: 'moveBlock', blockId: block.id, direction })
          }
          borderColor={theme.colors.outlineVariant ?? theme.colors.outline}
          selectedColor={theme.colors.primaryContainer}
        />
      ))}
    </ScrollView>
  );
}

function BlockEditor({
  block,
  selected,
  onSelect,
  onChangeText,
  onToggleCheck,
  onRemove,
  onMove,
  borderColor,
  selectedColor,
}: {
  block: ContentBlock;
  selected: boolean;
  onSelect: () => void;
  onChangeText: (text: string) => void;
  onToggleCheck: () => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
  borderColor: string;
  selectedColor: string;
}) {
  const text = plainFromSpans(block.spans);
  const label = block.type.replace(/([0-9])/, ' $1');

  if (block.type === 'divider') {
    return (
      <View style={[styles.block, selected && { backgroundColor: selectedColor }]}>
        <View style={[styles.divider, { backgroundColor: borderColor }]} />
        <View style={styles.rowActions}>
          <IconButton
            icon="arrow-up"
            size={18}
            accessibilityLabel="Move block up"
            onPress={() => onMove('up')}
          />
          <IconButton
            icon="arrow-down"
            size={18}
            accessibilityLabel="Move block down"
            onPress={() => onMove('down')}
          />
          <IconButton
            icon="delete-outline"
            size={18}
            accessibilityLabel="Delete block"
            onPress={onRemove}
          />
        </View>
      </View>
    );
  }

  if (block.type === 'table' && block.rows) {
    return (
      <View
        style={[
          styles.block,
          { borderColor },
          selected && { backgroundColor: selectedColor },
        ]}
        onTouchStart={onSelect}
      >
        <Text variant="labelSmall" style={styles.label}>
          Table
        </Text>
        {block.rows.map((row, ri) => (
          <Text key={`r-${ri}`} style={styles.tableRow}>
            {row.map((c) => plainFromSpans(c.spans)).join(' | ')}
          </Text>
        ))}
        <View style={styles.rowActions}>
          <IconButton
            icon="arrow-up"
            size={18}
            accessibilityLabel="Move block up"
            onPress={() => onMove('up')}
          />
          <IconButton
            icon="arrow-down"
            size={18}
            accessibilityLabel="Move block down"
            onPress={() => onMove('down')}
          />
          <IconButton
            icon="delete-outline"
            size={18}
            accessibilityLabel="Delete block"
            onPress={onRemove}
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.block,
        { borderColor },
        selected && { backgroundColor: selectedColor },
      ]}
    >
      <Text variant="labelSmall" style={styles.label}>
        {label}
      </Text>
      <View style={styles.inputRow}>
        {block.type === 'checkbox' ? (
          <IconButton
            icon={block.checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
            accessibilityLabel={block.checked ? 'Uncheck item' : 'Check item'}
            onPress={onToggleCheck}
          />
        ) : null}
        <TextInput
          mode="flat"
          multiline
          value={text}
          onFocus={onSelect}
          onChangeText={onChangeText}
          style={[
            styles.input,
            block.type === 'heading1' && styles.h1,
            block.type === 'heading2' && styles.h2,
            block.type === 'heading3' && styles.h3,
            block.type === 'code' && styles.code,
            block.type === 'quote' && styles.quote,
          ]}
          dense
        />
      </View>
      <View style={styles.rowActions}>
        <IconButton
          icon="arrow-up"
          size={18}
          accessibilityLabel="Move block up"
          onPress={() => onMove('up')}
        />
        <IconButton
          icon="arrow-down"
          size={18}
          accessibilityLabel="Move block down"
          onPress={() => onMove('down')}
        />
        <IconButton
          icon="delete-outline"
          size={18}
          accessibilityLabel="Delete block"
          onPress={onRemove}
        />
      </View>
    </View>
  );
}

function SlidesEditor({
  slides,
  onChange,
}: {
  slides: SlideContent[];
  onChange: (slides: SlideContent[]) => void;
}) {
  return (
    <View style={styles.section}>
      <Text variant="titleMedium">Slides</Text>
      {slides.map((slide, index) => (
        <View key={slide.id} style={styles.slideCard}>
          <TextInput
            mode="outlined"
            label={`Slide ${index + 1} title`}
            value={slide.title}
            onChangeText={(title) => {
              const next = [...slides];
              next[index] = { ...slide, title };
              onChange(next);
            }}
          />
          <TextInput
            mode="outlined"
            label="Bullets (one per line)"
            multiline
            value={slide.bullets.join('\n')}
            onChangeText={(text) => {
              const next = [...slides];
              next[index] = {
                ...slide,
                bullets: text.split('\n').map((l) => l.trim()).filter(Boolean),
              };
              onChange(next);
            }}
            style={styles.area}
          />
          <TextInput
            mode="outlined"
            label="Speaker notes"
            multiline
            value={slide.notes ?? ''}
            onChangeText={(notes) => {
              const next = [...slides];
              next[index] = { ...slide, notes };
              onChange(next);
            }}
          />
        </View>
      ))}
    </View>
  );
}

function SheetEditor({
  sheet,
  onChange,
}: {
  sheet: SpreadsheetData;
  onChange: (sheet: SpreadsheetData) => void;
}) {
  return (
    <View style={styles.section}>
      <Text variant="titleMedium">Spreadsheet · {sheet.sheetName}</Text>
      <ScrollView horizontal>
        <View>
          <View style={styles.sheetRow}>
            {sheet.columns.map((col, ci) => (
              <TextInput
                key={`c-${ci}`}
                mode="outlined"
                dense
                value={col}
                style={styles.cell}
                onChangeText={(value) => {
                  const columns = [...sheet.columns];
                  columns[ci] = value;
                  onChange({ ...sheet, columns });
                }}
              />
            ))}
          </View>
          {sheet.rows.map((row, ri) => (
            <View key={`r-${ri}`} style={styles.sheetRow}>
              {row.map((cell, ci) => (
                <TextInput
                  key={`c-${ri}-${ci}`}
                  mode="outlined"
                  dense
                  value={cell.value == null ? '' : String(cell.value)}
                  style={styles.cell}
                  onChangeText={(value) => {
                    const rows = sheet.rows.map((r) => r.map((c) => ({ ...c })));
                    const numeric = Number(value);
                    rows[ri][ci] = {
                      value:
                        value.trim() === ''
                          ? ''
                          : Number.isFinite(numeric) && value.trim() !== '' && /^-?\d+(\.\d+)?$/.test(value)
                            ? numeric
                            : value,
                    };
                    onChange({ ...sheet, rows });
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 120, gap: 8 },
  block: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  label: { opacity: 0.55, marginBottom: 2, textTransform: 'capitalize' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start' },
  input: { flex: 1, backgroundColor: 'transparent' },
  h1: { fontSize: 24, fontWeight: '700' },
  h2: { fontSize: 20, fontWeight: '700' },
  h3: { fontSize: 17, fontWeight: '600' },
  code: { fontFamily: 'monospace', fontSize: 13 },
  quote: { fontStyle: 'italic', borderLeftWidth: 3, paddingLeft: 8 },
  rowActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  divider: { height: 1, marginVertical: 12 },
  tableRow: { marginBottom: 4 },
  section: { marginBottom: 16, gap: 8 },
  slideCard: { gap: 8, marginBottom: 12 },
  area: { minHeight: 120 },
  sheetRow: { flexDirection: 'row' },
  cell: { width: 120, margin: 2 },
});
