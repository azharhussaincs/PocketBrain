import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Checkbox, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useConsentStore } from './consentStore';
import { AI_DISCLAIMER, PRIVACY_POLICY, TERMS_OF_SERVICE } from '../legal/content/policies';
import { AI_TASKS, type TaskId } from '../discover/tasks';

type Step =
  | 'welcome'
  | 'how'
  | 'privacy'
  | 'terms'
  | 'ai'
  | 'prefs'
  | 'firstTask';

/**
 * First-launch experience: product story → legal → prefs → first task.
 * Play-aligned: explicit acceptance of Privacy, Terms, and AI disclaimer.
 */
export function OnboardingConsentGate({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const onboardingCompleted = useConsentStore((s) => s.onboardingCompleted);
  const setConsent = useConsentStore((s) => s.setConsent);

  const [privacy, setPrivacy] = useState(false);
  const [terms, setTerms] = useState(false);
  const [ai, setAi] = useState(false);
  const [downloads, setDownloads] = useState(true);
  const [step, setStep] = useState<Step>('welcome');

  if (onboardingCompleted) return <>{children}</>;

  const finish = (firstTaskId?: TaskId) => {
    const now = Date.now();
    setConsent('acceptedTerms', true);
    setConsent('acceptedPrivacy', true);
    setConsent('acceptedAiDisclaimer', true);
    setConsent('termsAcceptedAt', now);
    setConsent('privacyAcceptedAt', now);
    setConsent('aiDisclaimerAcceptedAt', now);
    setConsent('allowModelDownloads', downloads);
    setConsent('analyticsConsent', false);
    setConsent('crashReportingConsent', false);
    if (firstTaskId) setConsent('pendingFirstTaskId', firstTaskId);
    setConsent('onboardingCompleted', true);
  };

  const firstTasks = AI_TASKS.filter((t) => !t.experimental).slice(0, 8);

  return (
    <View style={[styles.gate, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {step === 'welcome' ? (
          <>
            <Text variant="displaySmall" style={styles.brand}>
              PocketBrain
            </Text>
            <Text variant="headlineSmall">Your offline AI platform</Text>
            <Text variant="bodyLarge" style={styles.sub}>
              Install open-source models on this device. No account. No cloud chat. Privacy by
              design.
            </Text>
            <Bullet icon="shield-lock-outline" text="AI runs locally after models are installed" />
            <Bullet icon="download-outline" text="Download only the models you need" />
            <Bullet icon="wifi-off" text="Many features keep working fully offline" />
            <Button mode="contained" onPress={() => setStep('how')} style={styles.cta}>
              Continue
            </Button>
          </>
        ) : null}

        {step === 'how' ? (
          <>
            <Text variant="headlineSmall">How it works</Text>
            <Text variant="bodyLarge" style={styles.sub}>
              1. Pick a task — write, study, code, vision, voice, and more.
            </Text>
            <Text variant="bodyLarge" style={styles.sub}>
              2. Download a recommended model to device storage (Wi‑Fi preferred).
            </Text>
            <Text variant="bodyLarge" style={styles.sub}>
              3. Use AI offline. Your prompts and files stay on this phone.
            </Text>
            <Text variant="bodyMedium" style={styles.sub}>
              Large models need free storage and enough RAM. PocketBrain will warn you before
              downloads that may not fit.
            </Text>
            <Button mode="contained" onPress={() => setStep('privacy')} style={styles.cta}>
              Review privacy
            </Button>
          </>
        ) : null}

        {step === 'privacy' ? (
          <>
            <Text variant="titleMedium">Privacy Policy</Text>
            <Text style={styles.doc}>{PRIVACY_POLICY}</Text>
            <Checkbox.Item
              label="I have read the Privacy Policy"
              status={privacy ? 'checked' : 'unchecked'}
              onPress={() => setPrivacy((v) => !v)}
              accessibilityLabel="Accept Privacy Policy"
            />
            <Button mode="contained" disabled={!privacy} onPress={() => setStep('terms')}>
              Continue
            </Button>
          </>
        ) : null}

        {step === 'terms' ? (
          <>
            <Text variant="titleMedium">Terms of Service</Text>
            <Text style={styles.doc}>{TERMS_OF_SERVICE}</Text>
            <Checkbox.Item
              label="I agree to the Terms of Service"
              status={terms ? 'checked' : 'unchecked'}
              onPress={() => setTerms((v) => !v)}
              accessibilityLabel="Accept Terms of Service"
            />
            <Button mode="contained" disabled={!terms} onPress={() => setStep('ai')}>
              Continue
            </Button>
          </>
        ) : null}

        {step === 'ai' ? (
          <>
            <Text variant="titleMedium">AI Usage Disclaimer</Text>
            <Text style={styles.doc}>{AI_DISCLAIMER}</Text>
            <Checkbox.Item
              label="I understand AI outputs may be inaccurate"
              status={ai ? 'checked' : 'unchecked'}
              onPress={() => setAi((v) => !v)}
              accessibilityLabel="Accept AI disclaimer"
            />
            <Button mode="contained" disabled={!ai} onPress={() => setStep('prefs')}>
              Continue
            </Button>
          </>
        ) : null}

        {step === 'prefs' ? (
          <>
            <Text variant="titleMedium">Downloads & privacy</Text>
            <Checkbox.Item
              label="Allow model downloads over the network (Wi‑Fi preferred)"
              status={downloads ? 'checked' : 'unchecked'}
              onPress={() => setDownloads((v) => !v)}
            />
            <Text variant="bodySmall" style={styles.sub}>
              Analytics and crash reporting stay off. Optional opt-in later in Settings → Privacy.
              No ads at launch.
            </Text>
            <Button mode="contained" onPress={() => setStep('firstTask')} style={styles.cta}>
              Choose what to do first
            </Button>
          </>
        ) : null}

        {step === 'firstTask' ? (
          <>
            <Text variant="headlineSmall">What do you want to do first?</Text>
            <Text variant="bodyMedium" style={styles.sub}>
              We’ll recommend the right local models for that task.
            </Text>
            <View style={styles.taskGrid}>
              {firstTasks.map((task) => (
                <Pressable
                  key={task.id}
                  accessibilityRole="button"
                  accessibilityLabel={task.title}
                  onPress={() => finish(task.id)}
                  style={[
                    styles.taskCard,
                    {
                      borderColor: theme.colors.outlineVariant ?? theme.colors.outline,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={task.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text variant="titleSmall" style={styles.taskTitle}>
                    {task.title}
                  </Text>
                  <Text variant="bodySmall" numberOfLines={2} style={styles.sub}>
                    {task.subtitle}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button mode="text" onPress={() => finish()}>
              Skip — open Home
            </Button>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Bullet({ icon, text }: { icon: string; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.bullet}>
      <MaterialCommunityIcons
        name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
        size={22}
        color={theme.colors.primary}
      />
      <Text variant="bodyLarge" style={styles.bulletText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gate: { flex: 1 },
  content: { padding: 20, paddingBottom: 56, gap: 12 },
  brand: { fontWeight: '700', marginBottom: 4 },
  sub: { opacity: 0.8, lineHeight: 22 },
  doc: { lineHeight: 20, fontSize: 13 },
  cta: { marginTop: 12 },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  bulletText: { flex: 1 },
  taskGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  taskCard: {
    width: '47%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
    minHeight: 110,
  },
  taskTitle: { marginTop: 8 },
});
