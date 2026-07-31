import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

const fontConfig = configureFonts({ config: { fontFamily: 'System' } });

/** PocketBrain brand: deep teal / slate — not purple-on-white or cream/serif defaults */
export const brand = {
  primary: '#0F766E',
  primaryContainer: '#CCFBF1',
  secondary: '#1E293B',
  tertiary: '#EA580C',
  surface: '#F8FAFC',
  surfaceDark: '#0B1220',
  outline: '#94A3B8',
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts: fontConfig,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: brand.primary,
    primaryContainer: brand.primaryContainer,
    secondary: brand.secondary,
    tertiary: brand.tertiary,
    background: brand.surface,
    surface: '#FFFFFF',
    surfaceVariant: '#E2E8F0',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#0F172A',
    onSurface: '#0F172A',
    outline: brand.outline,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  fonts: fontConfig,
  roundness: 12,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#2DD4BF',
    primaryContainer: '#134E4A',
    secondary: '#94A3B8',
    tertiary: '#FB923C',
    background: brand.surfaceDark,
    surface: '#111827',
    surfaceVariant: '#1F2937',
    onPrimary: '#042F2E',
    onSecondary: '#0B1220',
    onBackground: '#F8FAFC',
    onSurface: '#F8FAFC',
    outline: '#64748B',
  },
};
