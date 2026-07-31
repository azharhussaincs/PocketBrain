import { Directory, File, Paths } from 'expo-file-system';

const ROOT = 'workspace';

export function getWorkspaceRoot(): Directory {
  const dir = new Directory(Paths.document, ROOT);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

export function getDocumentsDir(): Directory {
  const dir = new Directory(getWorkspaceRoot(), 'documents');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function getExportsDir(): Directory {
  const dir = new Directory(getWorkspaceRoot(), 'exports');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function getVersionsDir(documentId: string): Directory {
  const dir = new Directory(getWorkspaceRoot(), 'versions', documentId);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function getBackupsDir(): Directory {
  const dir = new Directory(getWorkspaceRoot(), 'backups');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function indexFile(): File {
  return new File(getWorkspaceRoot(), 'index.json');
}

export function documentFile(documentId: string): File {
  return new File(getDocumentsDir(), `${documentId}.json`);
}

export function versionFile(documentId: string, versionId: string): File {
  return new File(getVersionsDir(documentId), `${versionId}.json`);
}

export function exportFile(fileName: string): File {
  return new File(getExportsDir(), fileName);
}

export function recoveryFile(documentId: string): File {
  return new File(getWorkspaceRoot(), 'recovery', `${documentId}.json`);
}

export function ensureRecoveryDir(): Directory {
  const dir = new Directory(getWorkspaceRoot(), 'recovery');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}
