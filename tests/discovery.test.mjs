import assert from 'node:assert/strict';
import test from 'node:test';

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function discoverModels(cards, filters) {
  let list = [...cards];
  const q = filters.query?.trim().toLowerCase() ?? '';
  if (q) {
    list = list.filter((m) =>
      `${m.friendlyName} ${m.author} ${m.license}`.toLowerCase().includes(q),
    );
  }
  if (filters.offlineOnly) list = list.filter((m) => m.offline);
  if (filters.maxRamBytes != null) {
    list = list.filter((m) => m.requiredRamBytes <= filters.maxRamBytes);
  }
  if (filters.sort === 'size_asc') {
    list.sort((a, b) => a.downloadSizeBytes - b.downloadSizeBytes);
  }
  return list;
}

function whyRecommended(card) {
  const reasons = [];
  if (card.isStarter) reasons.push('Starter-friendly first download');
  if (card.offline) reasons.push('Works offline after install');
  return reasons.join(' · ') || 'Compatible with PocketBrain local runtimes';
}

test('formatBytes formats common sizes', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1.0 KB');
  assert.equal(formatBytes(5 * 1024 * 1024), '5.0 MB');
});

test('discoverModels filters offline and query', () => {
  const cards = [
    {
      friendlyName: 'SmolLM',
      author: 'HuggingFaceTB',
      license: 'Apache-2.0',
      offline: true,
      requiredRamBytes: 400_000_000,
      downloadSizeBytes: 100,
      isStarter: true,
    },
    {
      friendlyName: 'HugeModel',
      author: 'Other',
      license: 'MIT',
      offline: false,
      requiredRamBytes: 8_000_000_000,
      downloadSizeBytes: 900,
      isStarter: false,
    },
  ];
  const filtered = discoverModels(cards, {
    query: 'smol',
    offlineOnly: true,
    maxRamBytes: 1_000_000_000,
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].friendlyName, 'SmolLM');
});

test('whyRecommended explains starter offline models', () => {
  const text = whyRecommended({ isStarter: true, offline: true });
  assert.match(text, /Starter-friendly/);
  assert.match(text, /offline/i);
});

test('discoverModels sorts by size ascending', () => {
  const cards = [
    { friendlyName: 'B', downloadSizeBytes: 200, offline: true, requiredRamBytes: 1, author: 'a', license: 'MIT' },
    { friendlyName: 'A', downloadSizeBytes: 50, offline: true, requiredRamBytes: 1, author: 'a', license: 'MIT' },
  ];
  const sorted = discoverModels(cards, { sort: 'size_asc' });
  assert.equal(sorted[0].friendlyName, 'A');
});
