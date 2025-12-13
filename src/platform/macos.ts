import type { Platform } from './types';

export const macosPlatform: Platform = {
  clipboard: {
    readText: async () => {
      return '';
    },
    writeText: async (_text: string) => {},
  },
  storage: {
    get: async <T,>(_key: string): Promise<T | null> => {
      return null;
    },
    set: async <T,>(_key: string, _value: T): Promise<void> => {},
  },
};
