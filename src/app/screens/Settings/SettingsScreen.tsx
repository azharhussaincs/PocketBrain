import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Divider, List, Switch, Text, TextInput } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatBytes } from '../../../utils/format';
import { useAppStore } from '../../../store/appStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { useConsentStore } from '../../../privacy/consentStore';
import { aiService } from '../../../services/AIService';
import { modelRegistry } from '../../../ai/registry/ModelRegistry';
import { permissionService } from '../../../permissions/PermissionService';
import type { PerformanceMode, ThemeMode } from '../../../types/settings';
import type { SettingsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'>;

export function SettingsScreen({ navigation }: Props) {
  const hardware = useAppStore((s) => s.hardware);
  const installed = useAppStore((s) => s.installed);
  const settings = useSettingsStore();
  const setSetting = useSettingsStore((s) => s.setSetting);
  const consent = useConsentStore();
  const setConsent = useConsentStore((s) => s.setConsent);

  const storageUsed = installed.reduce((sum, m) => sum + (m.sizeBytes || 0), 0);
  const caps = modelRegistry.availableCapabilities(true);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">Settings</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Privacy-first defaults. Analytics and crash reporting stay off unless you opt in.
      </Text>

      <Section title="Appearance & accessibility">
        <List.Item
          title="Theme"
          description={settings.theme}
          accessibilityLabel={`Theme ${settings.theme}. Double tap to cycle`}
          onPress={() => {
            const order: ThemeMode[] = ['system', 'light', 'dark'];
            const next = order[(order.indexOf(settings.theme) + 1) % order.length];
            setSetting('theme', next);
          }}
          right={() => <Text style={styles.value}>{settings.theme}</Text>}
        />
        <List.Item
          title="Language"
          description={`${settings.language} (English shipped; catalog ready for localization)`}
          accessibilityLabel={`Language ${settings.language}`}
          onPress={() => setSetting('language', settings.language === 'en' ? 'en' : 'en')}
        />
        <List.Item
          title="Dynamic type"
          description="Follows system font size (capped at 2× for layout safety)"
          accessibilityLabel="Dynamic type follows system font size"
        />
        <List.Item
          title="Screen reader"
          description="Compatible with TalkBack / VoiceOver via React Native semantics"
          accessibilityLabel="Screen reader compatibility information"
        />
      </Section>

      <Section title="Privacy">
        <List.Item
          title="Allow model downloads"
          description="Uses network only when you download models"
          right={() => (
            <Switch
              value={consent.allowModelDownloads}
              onValueChange={(v) => setConsent('allowModelDownloads', v)}
            />
          )}
        />
        <List.Item
          title="Metered network downloads"
          description="Allow downloads on cellular (off by default)"
          right={() => (
            <Switch
              value={consent.allowMeteredNetworkDownloads}
              onValueChange={(v) => setConsent('allowMeteredNetworkDownloads', v)}
            />
          )}
        />
        <List.Item
          title="Analytics"
          description="Not available — no analytics SDK is bundled in this release"
          right={() => (
            <Switch value={false} disabled onValueChange={() => undefined} />
          )}
        />
        <List.Item
          title="Crash reporting"
          description="Not available — no crash SDK is bundled in this release"
          right={() => (
            <Switch value={false} disabled onValueChange={() => undefined} />
          )}
        />
        <List.Item
          title="Offline mode"
          description="Block network features when enabled"
          right={() => (
            <Switch
              value={settings.offlineMode}
              onValueChange={(v) => setSetting('offlineMode', v)}
            />
          )}
        />
      </Section>

      <Section title="Legal">
        <List.Item title="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
        <List.Item title="Terms of Service" onPress={() => navigation.navigate('TermsOfService')} />
        <List.Item title="AI Usage Disclaimer" onPress={() => navigation.navigate('AiDisclaimer')} />
        <List.Item title="About PocketBrain" onPress={() => navigation.navigate('About')} />
        <List.Item title="Open Source Licenses" onPress={() => navigation.navigate('Licenses')} />
        <List.Item
          title="Third-Party Licenses"
          onPress={() => navigation.navigate('ThirdPartyLicenses')}
        />
        <List.Item title="Model Licenses" onPress={() => navigation.navigate('ModelLicenses')} />
        <List.Item title="Contact Support" onPress={() => navigation.navigate('ContactSupport')} />
        <List.Item title="FAQ" onPress={() => navigation.navigate('Faq')} />
        <List.Item title="Copyright" onPress={() => navigation.navigate('Copyright')} />
        <List.Item title="Report Issue" onPress={() => navigation.navigate('ReportIssue')} />
      </Section>

      <Section title="Permissions">
        <List.Item
          title="Open system settings"
          description="Revoke microphone, camera, or photos anytime"
          onPress={() => permissionService.openSystemSettings()}
        />
        <List.Item
          title="Permission policy"
          description="PocketBrain only prompts when you start Speech, Camera, or Library features"
        />
      </Section>

      <Section title="Downloads & storage">
        <List.Item
          title="Manage storage"
          description="Models, documents, exports, cache"
          onPress={() =>
            navigation.getParent()?.navigate('HomeTab', { screen: 'Storage' })
          }
        />
        <List.Item
          title="Files & AI outputs"
          description="Browse generated content"
          onPress={() =>
            navigation.getParent()?.navigate('HomeTab', { screen: 'Files' })
          }
        />
        <List.Item
          title="Global search"
          description="Find chats, docs, models, and tasks"
          onPress={() =>
            navigation.getParent()?.navigate('HomeTab', { screen: 'GlobalSearch' })
          }
        />
        <List.Item
          title="Wi-Fi only downloads"
          description={
            settings.wifiOnlyDownloads
              ? 'On — downloads need Wi‑Fi'
              : 'Off — Wi‑Fi or mobile data allowed'
          }
          right={() => (
            <Switch
              value={settings.wifiOnlyDownloads}
              onValueChange={(v) => setSetting('wifiOnlyDownloads', v)}
            />
          )}
        />
        <List.Item
          title="Check for model updates"
          description="Optional local catalog comparison — never automatic background network polling"
          right={() => (
            <Switch
              value={settings.autoCheckModelUpdates}
              onValueChange={(v) => setSetting('autoCheckModelUpdates', v)}
            />
          )}
        />
        <List.Item title="Models storage used" description={formatBytes(storageUsed)} />
        <List.Item
          title="Free device storage"
          description={
            hardware?.freeStorageBytes != null ? formatBytes(hardware.freeStorageBytes) : '—'
          }
        />
        <List.Item
          title="Model cache"
          description="Installed GGUF/ONNX files under app documents"
        />
      </Section>

      <Section title="AI runtime & performance">
        <List.Item
          title="Active capabilities"
          description={caps.join(', ') || 'none'}
        />
        <List.Item
          title="Runtime diagnostics"
          description={(() => {
            const d = aiService.getDiagnostics();
            return `${d.activeRuntime ?? 'None'}${d.usingMock ? ' (mock)' : ''}${
              d.loadedModelId ? ` · ${d.loadedModelId}` : ''
            }${d.lastDurationMs != null ? ` · last ${d.lastDurationMs}ms` : ''}`;
          })()}
        />
        <List.Item
          title="Unload model from memory"
          description="Frees RAM after inference"
          onPress={() => {
            void aiService.unloadModel().then(() =>
              Alert.alert('Unloaded', 'Active model released from memory.'),
            );
          }}
        />
        <List.Item
          title="GPU acceleration"
          right={() => (
            <Switch
              value={settings.gpuEnabled}
              onValueChange={(v) => setSetting('gpuEnabled', v)}
            />
          )}
        />
        <List.Item
          title="Performance mode"
          description={settings.performanceMode}
          onPress={() => {
            const order: PerformanceMode[] = ['balanced', 'performance', 'battery_saver'];
            const next =
              order[(order.indexOf(settings.performanceMode) + 1) % order.length];
            setSetting('performanceMode', next);
          }}
        />
        <List.Item
          title="Battery optimization"
          description={
            settings.performanceMode === 'battery_saver'
              ? 'Battery saver active — fewer threads, GPU off'
              : 'Use Battery saver mode to reduce threads/GPU use'
          }
        />
        <View style={styles.field}>
          <Text variant="labelLarge">CPU threads</Text>
          <TextInput
            mode="outlined"
            keyboardType="number-pad"
            value={String(settings.cpuThreads)}
            onChangeText={(text) => {
              const n = Number(text.replace(/[^0-9]/g, '')) || 1;
              setSetting('cpuThreads', Math.min(Math.max(n, 1), 16));
            }}
          />
        </View>
        <View style={styles.field}>
          <Text variant="labelLarge">Context size</Text>
          <TextInput
            mode="outlined"
            keyboardType="number-pad"
            value={String(settings.defaultContextSize)}
            onChangeText={(text) => {
              const n = Number(text.replace(/[^0-9]/g, '')) || 512;
              setSetting('defaultContextSize', Math.min(Math.max(n, 256), 8192));
            }}
          />
        </View>
        <View style={styles.field}>
          <Text variant="labelLarge">Memory limit (MB)</Text>
          <TextInput
            mode="outlined"
            keyboardType="number-pad"
            value={String(settings.memoryLimitMb)}
            onChangeText={(text) => {
              const n = Number(text.replace(/[^0-9]/g, '')) || 1024;
              setSetting('memoryLimitMb', Math.min(Math.max(n, 512), 16384));
            }}
          />
        </View>
      </Section>

      <Section title="Hardware">
        <List.Item title="Device" description={hardware?.modelName ?? '—'} />
        <List.Item title="OS" description={`${hardware?.platform} ${hardware?.osVersion ?? ''}`} />
        <List.Item
          title="RAM"
          description={
            hardware?.totalRamBytes != null ? formatBytes(hardware.totalRamBytes) : '—'
          }
        />
        <List.Item
          title="Recommended model budget"
          description={
            hardware ? formatBytes(hardware.recommendedMaxModelRamBytes) : '—'
          }
        />
        <List.Item title="Active runtime" description={aiService.getActiveRuntimeName()} />
        {hardware?.androidApiLevel != null ? (
          <List.Item title="Android API" description={String(hardware.androidApiLevel)} />
        ) : null}
        <List.Item
          title="CPU arch"
          description={hardware?.cpuArchitectures?.join(', ') ?? '—'}
        />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="titleMedium">{title}</Text>
      <Divider style={styles.divider} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  subtitle: { opacity: 0.7, marginBottom: 16 },
  section: { marginBottom: 20 },
  divider: { marginVertical: 8 },
  field: { marginHorizontal: 16, marginBottom: 12, gap: 6 },
  value: { alignSelf: 'center', marginRight: 8, opacity: 0.7 },
});
