import type { RuntimeAdapter } from '../../types/inference';
import type { RuntimeId } from '../../types/models';

/**
 * Placeholder adapters for formats that are architecturally supported but not
 * linked in this release. They report unavailable instead of fabricating output.
 */
function unavailableAdapter(
  id: RuntimeId,
  displayName: string,
  reason: string,
): RuntimeAdapter {
  return {
    id,
    displayName,
    async isAvailable() {
      return false;
    },
    async loadModel() {
      throw new Error(reason);
    },
    async unloadModel() {
      // no-op
    },
    isModelLoaded() {
      return false;
    },
    async complete() {
      throw new Error(reason);
    },
  };
}

export const onnxAdapter = unavailableAdapter(
  'onnx',
  'ONNX Runtime',
  'ONNX Runtime is not linked in this PocketBrain build. GGUF via llama.cpp remains the supported production path.',
);

export const mediaPipeAdapter = unavailableAdapter(
  'mediapipe',
  'MediaPipe',
  'MediaPipe models are not linked in this PocketBrain build yet.',
);

export const coreMlAdapter = unavailableAdapter(
  'coreml',
  'Core ML',
  'Core ML is not linked in this PocketBrain build yet.',
);

export const mlcAdapter = unavailableAdapter(
  'mlc',
  'MLC LLM',
  'MLC LLM is not linked in this PocketBrain build yet.',
);
