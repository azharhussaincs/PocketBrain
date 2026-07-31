import React, { useEffect, useMemo } from 'react';
import { NativeModules, Text as RNText, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, Text as PaperText } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { darkTheme, lightTheme } from './src/theme';
import { useAppStore } from './src/store/appStore';
import { useSettingsStore } from './src/store/settingsStore';
import { OnboardingConsentGate } from './src/privacy/OnboardingConsentGate';
import { downloadManager } from './src/services/DownloadManager';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

type TextWithDefaults = { defaultProps?: { maxFontSizeMultiplier?: number } };
const rnText = RNText as unknown as TextWithDefaults;
const paperText = PaperText as unknown as TextWithDefaults;
rnText.defaultProps = { ...(rnText.defaultProps ?? {}), maxFontSizeMultiplier: 2 };
paperText.defaultProps = { ...(paperText.defaultProps ?? {}), maxFontSizeMultiplier: 2 };

/** Turn off Expo Dev Client floating Tools gear (duplicate of Settings tab for users). */
function disableExpoToolsFab() {
  if (!__DEV__) return;
  try {
    const prefs = NativeModules.DevMenuPreferences as
      | { setSettings?: (s: Record<string, unknown>) => void }
      | undefined;
    prefs?.setSettings?.({
      showFloatingActionButton: false,
      showsAtLaunch: false,
      isOnboardingFinished: true,
    });
  } catch {
    // Best-effort; also disabled via AndroidManifest meta-data.
  }
}

export default function App() {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.theme);
  const bootstrap = useAppStore((s) => s.bootstrap);

  useEffect(() => {
    disableExpoToolsFab();
    void (async () => {
      await downloadManager.hydrate();
      await bootstrap();
      await SplashScreen.hideAsync().catch(() => undefined);
    })();
  }, [bootstrap]);

  const resolvedDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  const paperTheme = resolvedDark ? darkTheme : lightTheme;

  const navigationTheme = useMemo(
    () => ({
      ...(resolvedDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(resolvedDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: paperTheme.colors.primary,
        background: paperTheme.colors.background,
        card: paperTheme.colors.surface,
        text: paperTheme.colors.onSurface,
        border: paperTheme.colors.outline,
        notification: paperTheme.colors.tertiary,
      },
    }),
    [paperTheme, resolvedDark],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <AppErrorBoundary>
            <OnboardingConsentGate>
              <NavigationContainer theme={navigationTheme}>
                <RootNavigator />
                <StatusBar style={resolvedDark ? 'light' : 'dark'} />
              </NavigationContainer>
            </OnboardingConsentGate>
          </AppErrorBoundary>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
