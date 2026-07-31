import { Buffer } from 'buffer';

// Polyfill for Office export libraries (docx / pptxgenjs / pdf-lib helpers)
if (typeof globalThis.Buffer === 'undefined') {
  (globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
}

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
