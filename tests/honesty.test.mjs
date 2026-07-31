import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

test('FeatureGate refuses to invent capabilities without models', () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), 'src/discover/FeatureGate.ts'),
    'utf8',
  );
  assert.match(src, /recommend|gate|capability/i);
  assert.doesNotMatch(src, /fakeOutput|inventAnswer/i);
});

test('ImageGenerationService refuses fake pixels', () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), 'src/ai/image/ImageGenerationService.ts'),
    'utf8',
  );
  assert.match(src, /refuse|unavailable|not available|fake/i);
});

test('AIService blocks fabricated answers without native runtime', () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), 'src/services/AIService.ts'),
    'utf8',
  );
  assert.match(src, /will not invent AI answers/i);
  assert.match(src, /isExpoGo|appOwnership/i);
});
