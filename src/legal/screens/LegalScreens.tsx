import React from 'react';
import { Linking, ScrollView, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../app/navigation/types';
import {
  ABOUT_TEXT,
  AI_DISCLAIMER,
  CONTACT_SUPPORT,
  COPYRIGHT_NOTICE,
  FAQ,
  OPEN_SOURCE_LICENSES,
  PRIVACY_POLICY,
  PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
  TERMS_OF_SERVICE,
  TERMS_URL,
} from '../content/policies';
import Constants from 'expo-constants';

type Props = NativeStackScreenProps<SettingsStackParamList, keyof SettingsStackParamList>;

function LegalBody({ title, body, extra }: { title: string; body: string; extra?: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">{title}</Text>
      <Text variant="bodyMedium" style={styles.body}>
        {body}
      </Text>
      {extra}
    </ScrollView>
  );
}

export function PrivacyPolicyScreen(_props: Props) {
  return (
    <LegalBody
      title="Privacy Policy"
      body={PRIVACY_POLICY}
      extra={
        <>
          <Text variant="bodySmall" style={styles.body}>
            In-app policy is always available offline. The web URL must be published before Play
            submission; if the link 404s, use this screen as the source of truth.
          </Text>
          <Button mode="outlined" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            Open web policy URL
          </Button>
        </>
      }
    />
  );
}

export function TermsOfServiceScreen(_props: Props) {
  return (
    <LegalBody
      title="Terms of Service"
      body={TERMS_OF_SERVICE}
      extra={
        <>
          <Text variant="bodySmall" style={styles.body}>
            In-app terms are always available offline. Publish the matching web page before Play
            submission.
          </Text>
          <Button mode="outlined" onPress={() => Linking.openURL(TERMS_URL)}>
            Open web terms URL
          </Button>
        </>
      }
    />
  );
}

export function AiDisclaimerScreen(_props: Props) {
  return <LegalBody title="AI Usage Disclaimer" body={AI_DISCLAIMER} />;
}

export function LicensesScreen(_props: Props) {
  return <LegalBody title="Open Source Licenses" body={OPEN_SOURCE_LICENSES} />;
}

export function AboutScreen(_props: Props) {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const build = Constants.nativeBuildVersion ?? 'dev';
  return (
    <LegalBody
      title="About PocketBrain"
      body={`${ABOUT_TEXT}\n\nApp version: ${version}\nNative build: ${build}`}
    />
  );
}

export function ContactSupportScreen(_props: Props) {
  return (
    <LegalBody
      title="Contact Support"
      body={CONTACT_SUPPORT}
      extra={
        <Button mode="contained" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
          Email support
        </Button>
      }
    />
  );
}

export function ReportIssueScreen(_props: Props) {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const subject = encodeURIComponent(`PocketBrain issue (v${version})`);
  const body = encodeURIComponent(
    `Describe the issue:\n\nSteps:\n1.\n2.\n\nDevice:\nOS:\nBuild type (dev client / Expo Go):\nModels installed:\n`,
  );
  return (
    <LegalBody
      title="Report Issue"
      body="Issues are sent only when you choose Email. No automatic crash uploads occur unless you later opt into crash reporting."
      extra={
        <Button
          mode="contained"
          onPress={() =>
            Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`)
          }
        >
          Compose email report
        </Button>
      }
    />
  );
}

export function ModelLicensesScreen(_props: Props) {
  return (
    <LegalBody
      title="Model License Information"
      body={`Each Marketplace model lists its license, author, and offline capability before download.

You must review and accept the model author’s license terms. PocketBrain does not relicense third-party model weights.

System engines (device TTS/STT, on-device OCR) follow platform vendor terms.

Downloading a model uses the network and stores files on your device. No model is uploaded from your device by PocketBrain.`}
    />
  );
}

export function ThirdPartyLicensesScreen(_props: Props) {
  return <LegalBody title="Third-Party Licenses" body={OPEN_SOURCE_LICENSES} />;
}

export function FaqScreen(_props: Props) {
  return <LegalBody title="FAQ" body={FAQ} />;
}

export function CopyrightScreen(_props: Props) {
  return <LegalBody title="Copyright" body={COPYRIGHT_NOTICE} />;
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48, gap: 12 },
  body: { lineHeight: 22 },
});
