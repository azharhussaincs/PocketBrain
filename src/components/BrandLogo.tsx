import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

type Props = {
  size?: number;
  showWordmark?: boolean;
  tagline?: string;
  compact?: boolean;
};

/**
 * In-app brand mark (raster from assets/icon.png).
 * Keeps Home / onboarding visually tied to the launcher icon.
 */
export function BrandLogo({
  size = 48,
  showWordmark = true,
  tagline,
  compact = false,
}: Props) {
  const theme = useTheme();
  const radius = Math.round(size * 0.22);

  return (
    <View
      style={[styles.row, compact && styles.compact]}
      accessibilityRole="header"
      accessibilityLabel="PocketBrain"
    >
      <Image
        source={require('../../assets/icon.png')}
        style={{ width: size, height: size, borderRadius: radius }}
        accessibilityIgnoresInvertColors
      />
      {showWordmark ? (
        <View style={styles.textCol}>
          <Text
            variant={compact ? 'titleLarge' : 'headlineSmall'}
            style={[styles.wordmark, { color: theme.colors.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            Pocket Brain
          </Text>
          {tagline ? (
            <Text variant="bodyMedium" style={styles.tagline} numberOfLines={2}>
              {tagline}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compact: { gap: 10 },
  textCol: { flex: 1, minWidth: 0 },
  wordmark: { fontWeight: '700', letterSpacing: -0.3 },
  tagline: { opacity: 0.72, marginTop: 2, lineHeight: 20 },
});
