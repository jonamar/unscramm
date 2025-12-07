/**
 * Chrome extension platform implementation
 * Uses Chrome Extension APIs for clipboard and storage
 */

import type { Platform } from './types';

export const chromePlatform: Platform = {
  clipboard: {
    readText: async () => {
      return navigator.clipboard.readText();
    },

    writeText: async (text: string) => {
      await navigator.clipboard.writeText(text);
    },
  },

  storage: {
    get: async <T,>(key: string): Promise<T | null> => {
      try {
        const result = await chrome.storage.local.get(key);
        return (result[key] as T) ?? null;
      } catch (error) {
        console.error('Chrome storage get error:', error);
        return null;
      }
    },

    set: async <T,>(key: string, value: T): Promise<void> => {
      try {
        await chrome.storage.local.set({ [key]: value });
      } catch (error) {
        console.error('Chrome storage set error:', error);
      }
    },
  },
};
