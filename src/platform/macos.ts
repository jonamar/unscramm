import type { Platform } from './types';

type PendingCall = {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
};

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        unscramm?: {
          postMessage: (message: unknown) => void;
        };
      };
    };
    __unscrammNativeResponse?: (payload: unknown) => void;
    __unscrammPending?: Map<number, PendingCall>;
    __unscrammNextId?: number;
  }
}

const hasNativeBridge = () => {
  return Boolean(window.webkit?.messageHandlers?.unscramm?.postMessage);
};

const ensureNativeResponseHandler = () => {
  if (window.__unscrammPending && window.__unscrammNativeResponse) return;

  window.__unscrammPending = new Map<number, PendingCall>();
  window.__unscrammNextId = 1;

  window.__unscrammNativeResponse = (payload: unknown) => {
    const msg = payload as { id?: number; ok?: boolean; result?: unknown; error?: unknown };
    const id = msg?.id;
    if (!id) return;
    const pending = window.__unscrammPending?.get(id);
    if (!pending) return;
    window.__unscrammPending?.delete(id);

    if (msg.ok) {
      pending.resolve(msg.result);
      return;
    }
    pending.reject(msg.error ?? new Error('Native call failed'));
  };
};

const callNative = async <T,>(type: string, body: Record<string, unknown> = {}): Promise<T> => {
  if (!hasNativeBridge()) {
    throw new Error('Native bridge unavailable');
  }
  ensureNativeResponseHandler();

  const id = window.__unscrammNextId ?? 1;
  window.__unscrammNextId = id + 1;

  const msg = { id, type, ...body };

  return await new Promise<T>((resolve, reject) => {
    window.__unscrammPending?.set(id, {
      resolve: resolve as unknown as (value: unknown) => void,
      reject: reject as unknown as (error: unknown) => void,
    });
    window.webkit!.messageHandlers!.unscramm!.postMessage(msg);
    window.setTimeout(() => {
      const pending = window.__unscrammPending?.get(id);
      if (!pending) return;
      window.__unscrammPending?.delete(id);
      reject(new Error('Native call timed out'));
    }, 3000);
  });
};

export const macosPlatform: Platform = {
  clipboard: {
    readText: async () => {
      if (hasNativeBridge()) {
        const text = await callNative<string>('clipboard.read');
        return typeof text === 'string' ? text : '';
      }

      // Fallback for running the macOS web build in a regular browser.
      if (navigator.clipboard?.readText) {
        return await navigator.clipboard.readText();
      }
      return '';
    },
    writeText: async (text: string) => {
      if (hasNativeBridge()) {
        await callNative<boolean>('clipboard.write', { text });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    },
  },
  storage: {
    get: async <T,>(_key: string): Promise<T | null> => {
      return null;
    },
    set: async <T,>(_key: string, _value: T): Promise<void> => {},
  },
};
