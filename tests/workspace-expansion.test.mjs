import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Lightweight source-level checks (no metro/babel). Ensures resolver + composer exist
 * and presentation intent maps to workspace generation.
 */
test('capability resolver module exists with presentation + honesty gates', () => {
  const src = fs.readFileSync(
    path.join(root, 'src/discover/capabilityResolver.ts'),
    'utf8',
  );
  assert.match(src, /PRESENTATION_GENERATION/);
  assert.match(src, /IMAGE_GENERATION/);
  assert.match(src, /VIDEO_GENERATION/);
  assert.match(src, /will not invent|not supported|limitationMessage/i);
  assert.match(src, /export function resolveCapabilityRequest/);
});

test('UniversalComposer and AttachmentService are wired', () => {
  assert.equal(
    fs.existsSync(path.join(root, 'src/components/UniversalComposer.tsx')),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(root, 'src/services/AttachmentService.ts')),
    true,
  );
  assert.equal(
    fs.existsSync(path.join(root, 'src/services/ChatOrchestrator.ts')),
    true,
  );
  const chat = fs.readFileSync(
    path.join(root, 'src/app/screens/Chat/ChatScreen.tsx'),
    'utf8',
  );
  assert.match(chat, /UniversalComposer/);
  assert.match(chat, /chatOrchestrator/);
  assert.match(chat, /assertCanSend/);
});

test('Chat never silently returns on empty model selection', () => {
  const orch = fs.readFileSync(
    path.join(root, 'src/services/ChatOrchestrator.ts'),
    'utf8',
  );
  assert.match(orch, /No text model is installed/);
  assert.match(orch, /explainBlocked/);
  assert.match(orch, /out of memory|OOM/i);
});

test('purpose-first Home tasks include presentation and files', () => {
  const tasks = fs.readFileSync(path.join(root, 'src/discover/tasks.ts'), 'utf8');
  assert.match(tasks, /id: 'presentation'/);
  assert.match(tasks, /id: 'files'/);
  assert.match(tasks, /Create Presentation/);
});
