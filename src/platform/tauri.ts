/**
 * Tauri platform implementation
 * Uses Tauri APIs for clipboard and storage
 */

import type { Platform } from './types';

export const tauriPlatform: Platform = {
  clipboard: {
    readText: async () => {
      // Dynamic import to avoid bundling Tauri in Chrome build
      const { readText } = await import('@tauri-apps/plugin-clipboard-manager');
      const text = await readText();
      return text || '';
    },

    writeText: async (text: string) => {
      // Dynamic import to avoid bundling Tauri in Chrome build
      const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
      await writeText(text);
    },
  },

  storage: {
    get: async <T,>(key: string): Promise<T | null> => {
      try {
        // Dynamic import to avoid bundling Tauri in Chrome build
        const { Store } = await import('@tauri-apps/plugin-store');
        const store = await Store.load('settings.json');
        const value = await store.get<T>(key);
        return value ?? null;
      } catch (error) {
        console.error('Tauri storage get error:', error);
        return null;
      }
    },

    set: async <T,>(key: string, value: T): Promise<void> => {
      try {
        // Dynamic import to avoid bundling Tauri in Chrome build
        const { Store } = await import('@tauri-apps/plugin-store');
        const store = await Store.load('settings.json');
        await store.set(key, value);
        await store.save();
      } catch (error) {
        console.error('Tauri storage set error:', error);
      }
    },
  },
};
