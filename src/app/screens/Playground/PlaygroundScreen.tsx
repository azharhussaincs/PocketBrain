import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { modelRegistry } from '../../../ai/registry/ModelRegistry';
import type { ModelCapability } from '../../../types/models';
import { aiService } from '../../../services/AIService';
import { visionService } from '../../../ai/vision/VisionService';
import { ocrService } from '../../../ai/ocr/OcrService';
import {
  speechToTextService,
  useSpeechRecognitionEvent,
} from '../../../ai/speech/SpeechToTextService';
import { textToSpeechService } from '../../../ai/tts/TextToSpeechService';
import { imageGenerationService } from '../../../ai/image/ImageGenerationService';
import { permissionService } from '../../../permissions/PermissionService';
import { workspaceService } from '../../../workspace/services/WorkspaceService';
import { createBlock } from '../../../workspace/utils/blocks';
import { useSettingsStore } from '../../../store/settingsStore';
import { ModelRequiredGate } from '../../../components/ModelRequiredGate';
import { ResponseActions } from '../../../components/ResponseActions';
import { MarkdownText } from '../../../components/MarkdownText';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootTabParamList } from '../../navigation/types';
import { generatedContentStore } from '../../../files/GeneratedContentStore';

type PlayMode =
  | 'chat'
  | 'image'
  | 'vision'
  | 'ocr'
  | 'speech'
  | 'voice'
  | 'translate'
  | 'code'
  | 'documents'
  | 'reasoning';

const MODE_META: Array<{
  value: PlayMode;
  label: string;
  capability?: ModelCapability | 'system';
}> = [
  { value: 'chat', label: 'Chat', capability: 'chat' },
  { value: 'image', label: 'Image', capability: 'image_generation' },
  { value: 'vision', label: 'Vision*', capability: 'vision' },
  { value: 'ocr', label: 'OCR', capability: 'ocr' },
  { value: 'speech', label: 'Speech', capability: 'speech' },
  { value: 'voice', label: 'Voice', capability: 'tts' },
  { value: 'translate', label: 'Translate', capability: 'translation' },
  { value: 'code', label: 'Code', capability: 'coding' },
  { value: 'documents', label: 'Docs', capability: 'documents' },
  { value: 'reasoning', label: 'Reason', capability: 'reasoning' },
];

const MODEL_PREF_KEY = '@pocketbrain/playground_model_by_mode';

export function PlaygroundScreen() {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const gpuEnabled = useSettingsStore((s) => s.gpuEnabled);
  const nCtx = useSettingsStore((s) => s.defaultContextSize);
  const [mode, setMode] = useState<PlayMode>('chat');
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [negative, setNegative] = useState('');
  const [rate, setRate] = useState('1.0');
  const [pitch, setPitch] = useState('1.0');
  const [modelPrefs, setModelPrefs] = useState<Record<string, string>>({});
  const [listening, setListening] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const capabilities = modelRegistry.availableCapabilities(true);

  useEffect(() => {
    void AsyncStorage.getItem(MODEL_PREF_KEY).then((raw) => {
      if (raw) setModelPrefs(JSON.parse(raw) as Record<string, string>);
    });
  }, []);

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results
      .map((r) => r.transcript)
      .join(' ')
      .trim();
    if (transcript) {
      setOutput(transcript);
      if (event.isFinal) setPrompt(transcript);
    }
  });
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    setOutput(`Speech error: ${event.message || event.error}`);
  });

  const modeEnabled = (m: PlayMode) => {
    const meta = MODE_META.find((x) => x.value === m);
    if (!meta?.capability || meta.capability === 'system') return true;
    if (meta.capability === 'tts' || meta.capability === 'speech' || meta.capability === 'ocr') {
      return true; // system engines exist; feature screens explain if native module missing
    }
    return capabilities.includes(meta.capability);
  };

  const modelsForMode = useMemo(() => {
    const capability = MODE_META.find((m) => m.value === mode)?.capability;
    if (!capability || capability === 'system') {
      return modelRegistry.listByCapability('chat', true);
    }
    if (capability === 'tts') return modelRegistry.listByCapability('tts', true);
    if (capability === 'speech') return modelRegistry.listByCapability('speech', true);
    if (capability === 'ocr') return modelRegistry.listByCapability('ocr', true);
    return modelRegistry.listByCapability(capability, true);
  }, [mode]);

  const selectedModelId =
    modelPrefs[mode] ?? modelsForMode[0]?.id ?? 'smollm2-135m-instruct-q4';

  const setModelForMode = async (modelId: string) => {
    const next = { ...modelPrefs, [mode]: modelId };
    setModelPrefs(next);
    await AsyncStorage.setItem(MODEL_PREF_KEY, JSON.stringify(next));
  };

  const pickImage = async (fromCamera: boolean) => {
    const kind = fromCamera ? 'camera' : 'mediaLibrary';
    const permission = await permissionService.ensure(
      kind,
      fromCamera
        ? 'Camera access is used only to capture an image for on-device Vision/OCR.'
        : 'Photo library access is used only to select an image you choose for on-device processing.',
    );
    if (!permission.granted) {
      Alert.alert('Permission required', 'Enable access in system settings to continue.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setOutput('');
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      switch (mode) {
        case 'speech': {
          if (listening) {
            speechToTextService.stop();
            setListening(false);
          } else {
            await speechToTextService.start({
              requiresOnDeviceRecognition: true,
              interimResults: true,
            });
            setListening(true);
            setOutput('Listening (on-device preferred)…');
          }
          break;
        }
        case 'voice': {
          if (!prompt.trim() && !output.trim()) {
            throw new Error('Enter text to speak.');
          }
          await textToSpeechService.speak({
            text: prompt.trim() || output,
            rate: Number(rate) || 1,
            pitch: Number(pitch) || 1,
          });
          setOutput('Speaking with on-device system voice…');
          break;
        }
        case 'ocr': {
          if (!imageUri) throw new Error('Pick or capture an image first.');
          const result = await ocrService.recognize(imageUri);
          setOutput(result.text || '(No text detected)');
          break;
        }
        case 'vision': {
          if (!imageUri) throw new Error('Pick or capture an image first.');
          let assembled = '';
          const result = await visionService.analyze({
            imageUri,
            task: prompt.trim() ? 'vqa' : 'describe',
            question: prompt.trim() || undefined,
            modelId: selectedModelId,
            signal: controller.signal,
            onToken: (t) => {
              assembled += t;
              setOutput(assembled);
            },
          });
          setOutput(result.text);
          break;
        }
        case 'image': {
          const result = await imageGenerationService.generate({
            prompt,
            negativePrompt: negative,
            initImageUri: imageUri ?? undefined,
            mode: imageUri ? 'img2img' : 'text2img',
            modelId: selectedModelId,
            signal: controller.signal,
          });
          setOutput(`${result.message}${result.outputPath ? `\n\nJob: ${result.outputPath}` : ''}`);
          break;
        }
        case 'documents': {
          const doc = await workspaceService.createWithAI({
            prompt: prompt.trim() || 'Create a short meeting summary',
            type: 'document',
            modelId: selectedModelId,
            onToken: (t) => setOutput((prev) => prev + t),
            signal: controller.signal,
          });
          setOutput(`Created Workspace document: ${doc.title}`);
          navigation.navigate('WorkspaceTab', {
            screen: 'DocumentEditor',
            params: { documentId: doc.id },
          });
          break;
        }
        default: {
          const system =
            mode === 'code'
              ? 'You are a local coding assistant.'
              : mode === 'reasoning'
                ? 'Think step by step, then answer.'
                : mode === 'translate'
                  ? 'Translate clearly. Detect source language automatically; default target English unless specified.'
                  : 'You are PocketBrain running fully offline.';
          let assembled = '';
          await aiService.generateText({
            modelId: selectedModelId,
            prompt: prompt.trim(),
            systemPrompt: system,
            gpuEnabled,
            nCtx,
            signal: controller.signal,
            onToken: ({ token, done }) => {
              if (done) return;
              assembled += token;
              setOutput(assembled);
            },
          });
          if (!assembled) setOutput('No output.');
        }
      }
    } catch (error) {
      setOutput(error instanceof Error ? error.message : 'Failed');
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const exportOcrToWorkspace = async () => {
    if (!output.trim()) return;
    const doc = await workspaceService.createBlank({
      title: `OCR ${new Date().toLocaleString()}`,
      type: 'note',
      body: {
        blocks: output.split(/\n/).map((line) => createBlock('paragraph', line)),
      },
      tags: ['ocr', 'imported'],
    });
    await generatedContentStore.saveText({
      title: doc.title,
      content: output,
      kind: 'ocr',
      source: 'playground',
      workspaceDocumentId: doc.id,
    });
    navigation.navigate('WorkspaceTab', {
      screen: 'DocumentEditor',
      params: { documentId: doc.id },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineSmall">AI Playground</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Modes unlock from installed model capabilities. Vision* is limited (no pixel load into GGUF).
        System TTS/STT/OCR use on-device engines.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScroll}>
        <SegmentedButtons
          value={mode}
          onValueChange={(v) => {
            setMode(v as PlayMode);
            setOutput('');
          }}
          buttons={MODE_META.map((m) => ({
            value: m.value,
            label: m.label,
          }))}
          density="small"
        />
      </ScrollView>

      <ModelRequiredGate playMode={mode} title="Install a compatible model">
        <View style={{ gap: 10 }}>
          <Text variant="labelLarge">Model</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {modelsForMode.map((m) => (
              <Button
                key={m.id}
                compact
                mode={selectedModelId === m.id ? 'contained' : 'outlined'}
                onPress={() => setModelForMode(m.id)}
                style={styles.modelChip}
              >
                {m.name.slice(0, 28)}
              </Button>
            ))}
          </ScrollView>

          {(mode === 'vision' || mode === 'ocr' || mode === 'image') && (
            <View style={styles.row}>
              <Button
                mode="outlined"
                accessibilityLabel="Pick image from library"
                onPress={() => pickImage(false)}
              >
                Library
              </Button>
              <Button
                mode="outlined"
                accessibilityLabel="Capture image with camera"
                onPress={() => pickImage(true)}
              >
                Camera
              </Button>
            </View>
          )}

          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
          ) : null}

          {mode === 'image' ? (
            <TextInput
              mode="outlined"
              label="Negative prompt"
              value={negative}
              onChangeText={setNegative}
            />
          ) : null}

          {mode === 'voice' ? (
            <View style={styles.row}>
              <TextInput
                mode="outlined"
                label="Speed"
                value={rate}
                onChangeText={setRate}
                style={styles.half}
                keyboardType="decimal-pad"
              />
              <TextInput
                mode="outlined"
                label="Pitch"
                value={pitch}
                onChangeText={setPitch}
                style={styles.half}
                keyboardType="decimal-pad"
              />
            </View>
          ) : null}

          {mode !== 'speech' && mode !== 'ocr' ? (
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={5}
              placeholder={
                mode === 'vision'
                  ? 'Optional question for visual Q&A'
                  : mode === 'voice'
                    ? 'Text to speak'
                    : 'Enter a prompt'
              }
              value={prompt}
              onChangeText={setPrompt}
              style={styles.input}
            />
          ) : null}

          <View style={styles.row}>
            <Button
              mode="contained"
              loading={busy}
              onPress={run}
              disabled={busy && mode !== 'speech'}
            >
              {mode === 'speech' ? (listening ? 'Stop' : 'Listen') : 'Run locally'}
            </Button>
            {busy && mode !== 'speech' ? (
              <Button
                mode="outlined"
                onPress={() => {
                  abortRef.current?.abort();
                  textToSpeechService.stop();
                }}
              >
                Cancel
              </Button>
            ) : null}
            {mode === 'ocr' && output ? (
              <Button mode="outlined" onPress={() => void exportOcrToWorkspace()}>
                To Workspace
              </Button>
            ) : null}
          </View>

          {busy ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}

          <View style={styles.output}>
            <Text variant="titleMedium">Output</Text>
            {output ? <MarkdownText content={output} /> : <Text style={styles.outputText}>—</Text>}
            {output && !busy ? (
              <ResponseActions
                text={output}
                title={`Playground ${mode}`}
                onOpenInWorkspace={(documentId) =>
                  navigation.navigate('WorkspaceTab', {
                    screen: 'DocumentEditor',
                    params: { documentId },
                  })
                }
              />
            ) : null}
          </View>
        </View>
      </ModelRequiredGate>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48, gap: 10 },
  subtitle: { opacity: 0.7 },
  modeScroll: { maxHeight: 56 },
  modelChip: { marginRight: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  preview: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#E2E8F0' },
  input: { minHeight: 120 },
  half: { flex: 1 },
  output: { marginTop: 12, gap: 6 },
  outputText: { lineHeight: 22 },
});
