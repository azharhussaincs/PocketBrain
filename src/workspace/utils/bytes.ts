import { decode as decodeBase64, encode as encodeBase64 } from 'base-64';

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return encodeBase64(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = decodeBase64(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function arrayBufferToBytes(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer);
}
