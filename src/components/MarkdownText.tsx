import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

/**
 * Lightweight markdown renderer — no extra native deps.
 * Supports headings, bold, italic, inline code, fenced code, lists, tables (simple).
 */
export function MarkdownText({ content }: { content: string }) {
  const theme = useTheme();
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <View>
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <View
              key={index}
              style={[styles.code, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              {block.lang ? (
                <Text variant="labelSmall" style={styles.lang}>
                  {block.lang}
                </Text>
              ) : null}
              <RNText selectable style={[styles.codeText, { color: theme.colors.onSurface }]}>
                {block.text}
              </RNText>
            </View>
          );
        }
        if (block.type === 'heading') {
          return (
            <Text
              key={index}
              variant={block.level === 1 ? 'titleLarge' : 'titleMedium'}
              style={styles.heading}
              selectable
            >
              {block.text}
            </Text>
          );
        }
        if (block.type === 'list') {
          return (
            <Text key={index} style={styles.line} selectable>
              {'• '}
              {renderInline(block.text)}
            </Text>
          );
        }
        if (block.type === 'table') {
          return (
            <RNText
              key={index}
              selectable
              style={[styles.table, { color: theme.colors.onSurface }]}
            >
              {block.text}
            </RNText>
          );
        }
        return (
          <Text key={index} style={styles.line} selectable>
            {renderInline(block.text)}
          </Text>
        );
      })}
    </View>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text))) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(
        <RNText key={key++} style={styles.bold}>
          {token.slice(2, -2)}
        </RNText>,
      );
    } else if (token.startsWith('*')) {
      parts.push(
        <RNText key={key++} style={styles.italic}>
          {token.slice(1, -1)}
        </RNText>,
      );
    } else if (token.startsWith('`')) {
      parts.push(
        <RNText key={key++} style={styles.inlineCode}>
          {token.slice(1, -1)}
        </RNText>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'list'; text: string }
  | { type: 'code'; lang?: string; text: string }
  | { type: 'table'; text: string };

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || undefined;
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) {
        body.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: 'code', lang, text: body.join('\n') });
      i += 1;
      continue;
    }
    if (/^#{1,3}\s+/.test(line)) {
      const level = line.match(/^#+/)?.[0].length ?? 1;
      blocks.push({ type: 'heading', level, text: line.replace(/^#+\s+/, '') });
      i += 1;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      blocks.push({ type: 'list', text: line.replace(/^[-*]\s+/, '') });
      i += 1;
      continue;
    }
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: 'table', text: tableLines.join('\n') });
      continue;
    }
    if (line.trim() === '') {
      i += 1;
      continue;
    }
    blocks.push({ type: 'paragraph', text: line });
    i += 1;
  }
  return blocks.length ? blocks : [{ type: 'paragraph', text: content }];
}

const styles = StyleSheet.create({
  line: { marginBottom: 4, lineHeight: 20 },
  heading: { marginTop: 8, marginBottom: 4 },
  code: { borderRadius: 8, padding: 10, marginVertical: 6 },
  lang: { opacity: 0.6, marginBottom: 4 },
  codeText: { fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  table: { fontFamily: 'monospace', fontSize: 11, marginVertical: 6 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  inlineCode: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 4,
  },
});
