import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as XLSX from 'xlsx';
import type { AttachmentKind, ChatAttachment } from '../types/attachments';
import { permissionService } from '../permissions/PermissionService';
import { createId } from '../utils/format';

const MAX_TEXT_CHARS = 80_000;
const MAX_ATTACHMENTS = 12;

const CODE_EXT = new Set([
  'js',
  'jsx',
  'ts',
  'tsx',
  'py',
  'java',
  'kt',
  'c',
  'cpp',
  'h',
  'hpp',
  'rs',
  'go',
  'rb',
  'php',
  'swift',
  'cs',
  'sql',
  'sh',
  'json',
  'yml',
  'yaml',
  'toml',
  'xml',
]);

const TEXT_EXT = new Set(['txt', 'md', 'markdown', 'csv', 'html', 'htm', 'svg', 'log', 'rtf']);

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

function kindFromName(name: string, mime?: string): AttachmentKind {
  const ext = extOf(name);
  const m = (mime ?? '').toLowerCase();
  if (m.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'heic'].includes(ext)) {
    return 'image';
  }
  if (m.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg', 'aac', 'flac'].includes(ext)) {
    return 'audio';
  }
  if (m.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
    return 'video';
  }
  if (ext === 'pdf' || m === 'application/pdf') return 'pdf';
  if (['doc', 'docx', 'odt'].includes(ext)) return 'document';
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'presentation';
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) return 'spreadsheet';
  if (ext === 'md' || ext === 'markdown') return 'markdown';
  if (CODE_EXT.has(ext)) return 'code';
  if (TEXT_EXT.has(ext) || m.startsWith('text/')) return 'text';
  return 'other';
}

function attachmentsDir(): Directory {
  const dir = new Directory(Paths.document, 'attachments');
  if (!dir.exists) dir.create();
  return dir;
}

async function copyIntoAppStorage(sourceUri: string, name: string): Promise<{ uri: string; sizeBytes: number }> {
  const safe = name.replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 120) || 'file';
  const dest = new File(attachmentsDir(), `${Date.now()}-${createId().slice(0, 8)}-${safe}`);
  const source = new File(sourceUri);
  const bytes = await source.bytes();
  dest.write(bytes);
  return { uri: dest.uri, sizeBytes: bytes.byteLength };
}

async function extractText(kind: AttachmentKind, name: string, uri: string): Promise<string | undefined> {
  const ext = extOf(name);
  try {
    if (kind === 'spreadsheet' || ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      if (ext === 'csv') {
        const file = new File(uri);
        const text = await file.text();
        return text.slice(0, MAX_TEXT_CHARS);
      }
      const file = new File(uri);
      const bytes = await file.bytes();
      const workbook = XLSX.read(bytes, { type: 'array' });
      const sheets = workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        return `## Sheet: ${sheetName}\n${csv}`;
      });
      return sheets.join('\n\n').slice(0, MAX_TEXT_CHARS);
    }

    if (
      kind === 'text' ||
      kind === 'markdown' ||
      kind === 'code' ||
      TEXT_EXT.has(ext) ||
      CODE_EXT.has(ext)
    ) {
      const file = new File(uri);
      const text = await file.text();
      return text.slice(0, MAX_TEXT_CHARS);
    }
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Could not read attachment contents.',
    );
  }
  return undefined;
}

function displayNameFrom(name: string, uri: string, kind: AttachmentKind): string {
  const raw = (name || '').trim();
  if (raw && !/^file:\/\//i.test(raw) && !raw.includes('/') && raw.length < 120) {
    return raw;
  }
  try {
    const path = raw.startsWith('file:') ? raw : uri;
    const base = path.split('/').pop() || path.split('%2F').pop() || '';
    const decoded = decodeURIComponent(base).split('?')[0];
    if (decoded && decoded.length > 0 && decoded !== 'document') return decoded.slice(0, 80);
  } catch {
    // fall through
  }
  return kind === 'image' ? 'Photo' : kind === 'audio' ? 'Audio' : 'Attachment';
}

async function materializeAttachment(input: {
  uri: string;
  name: string;
  mimeType?: string;
  sizeBytes?: number;
}): Promise<ChatAttachment> {
  const id = createId();
  const kind = kindFromName(input.name, input.mimeType);
  const displayName = displayNameFrom(input.name, input.uri, kind);
  let uri = input.uri;
  let sizeBytes = input.sizeBytes ?? 0;
  let status: ChatAttachment['status'] = 'processing';
  let textExcerpt: string | undefined;
  let errorMessage: string | undefined;

  try {
    const copied = await copyIntoAppStorage(input.uri, displayName);
    uri = copied.uri;
    sizeBytes = copied.sizeBytes || sizeBytes;

    try {
      textExcerpt = await extractText(kind, displayName, uri);
      status = 'ready';
      if (
        !textExcerpt &&
        (kind === 'pdf' || kind === 'document' || kind === 'presentation' || kind === 'other')
      ) {
        status = 'ready';
        errorMessage = undefined;
      }
      if (kind === 'audio' || kind === 'video') {
        status = 'ready';
      }
      if (kind === 'image') {
        status = 'ready';
      }
    } catch (error) {
      status = 'error';
      errorMessage =
        error instanceof Error ? error.message : 'Failed to process attachment.';
    }
  } catch (error) {
    status = 'error';
    errorMessage =
      error instanceof Error ? error.message : 'Could not copy file into app storage.';
  }

  return {
    id,
    uri,
    name: displayName,
    mimeType: input.mimeType,
    sizeBytes,
    kind,
    textExcerpt,
    status,
    errorMessage,
  };
}

/**
 * Picks and materializes user attachments for the Universal Composer.
 * Permissions are requested only at the feature entry point.
 */
export class AttachmentService {
  get maxAttachments(): number {
    return MAX_ATTACHMENTS;
  }

  async pickDocuments(existingCount = 0): Promise<ChatAttachment[]> {
    const remaining = Math.max(0, MAX_ATTACHMENTS - existingCount);
    if (remaining <= 0) return [];

    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (result.canceled || !result.assets?.length) return [];

    const assets = result.assets.slice(0, remaining);
    const out: ChatAttachment[] = [];
    for (const asset of assets) {
      out.push(
        await materializeAttachment({
          uri: asset.uri,
          name: asset.name || 'document',
          mimeType: asset.mimeType,
          sizeBytes: asset.size ?? 0,
        }),
      );
    }
    return out;
  }

  async pickImagesFromGallery(existingCount = 0): Promise<ChatAttachment[]> {
    const remaining = Math.max(0, MAX_ATTACHMENTS - existingCount);
    if (remaining <= 0) return [];

    const perm = await permissionService.ensure(
      'mediaLibrary',
      'PocketBrain needs photo access so you can attach images for OCR, analysis, or document workflows. Images stay on this device.',
    );
    if (!perm.granted) return [];

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.9,
      selectionLimit: remaining,
    });
    if (result.canceled || !result.assets?.length) return [];

    const out: ChatAttachment[] = [];
    for (const asset of result.assets.slice(0, remaining)) {
      const name =
        asset.fileName ||
        `image-${Date.now()}.${(asset.mimeType ?? 'image/jpeg').split('/')[1] || 'jpg'}`;
      out.push(
        await materializeAttachment({
          uri: asset.uri,
          name,
          mimeType: asset.mimeType,
          sizeBytes: asset.fileSize ?? 0,
        }),
      );
    }
    return out;
  }

  async takePhoto(existingCount = 0): Promise<ChatAttachment | null> {
    if (existingCount >= MAX_ATTACHMENTS) return null;

    const perm = await permissionService.ensure(
      'camera',
      'PocketBrain uses the camera only when you capture a photo to attach. Photos stay on this device.',
    );
    if (!perm.granted) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    const name =
      asset.fileName ||
      `camera-${Date.now()}.${(asset.mimeType ?? 'image/jpeg').split('/')[1] || 'jpg'}`;
    return materializeAttachment({
      uri: asset.uri,
      name,
      mimeType: asset.mimeType,
      sizeBytes: asset.fileSize ?? 0,
    });
  }

  async removeFromDisk(attachment: ChatAttachment): Promise<void> {
    try {
      const file = new File(attachment.uri);
      if (file.exists) file.delete();
    } catch {
      // best-effort cleanup
    }
  }
}

export const attachmentService = new AttachmentService();
