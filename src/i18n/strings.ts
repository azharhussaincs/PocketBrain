/**
 * Lightweight string catalog for future localization.
 * UI can gradually migrate to t('key') without rewriting screens wholesale.
 */
const EN: Record<string, string> = {
  'app.name': 'PocketBrain',
  'home.title': 'What do you want to do?',
  'home.subtitle':
    'PocketBrain runs AI on your phone. Download only what you need — then use it offline.',
  'chat.title': 'Chat',
  'chat.empty': 'Private on-device chat',
  'chat.mock':
    'Development mock runtime — install a GGUF model + native build for real inference',
  'chat.nativeMissing':
    'A model is installed, but the native runtime is missing. Build with llama.rn to run real inference.',
  'marketplace.title': 'Model Marketplace',
  'marketplace.subtitle': 'Organized by purpose. Advanced details stay hidden until you ask.',
  'downloads.title': 'Download Center',
  'files.title': 'Files',
  'storage.title': 'Storage',
  'settings.title': 'Settings',
  'common.copy': 'Copy',
  'common.share': 'Share',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.retry': 'Retry',
  'error.noModel': 'No installed model file found. Download a model first.',
  'error.nativeRuntime':
    'Native llama.cpp runtime is not available in this build. Use a custom development build.',
};

const catalogs: Record<string, Record<string, string>> = {
  en: EN,
};

export function t(key: string, language = 'en'): string {
  return catalogs[language]?.[key] ?? catalogs.en[key] ?? key;
}

export function availableLanguages(): string[] {
  return Object.keys(catalogs);
}
