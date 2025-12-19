import { useEffect, useRef, useState } from 'react';
import type { Platform } from '../platform/types';

const STORAGE_KEY_HISTORY_ITEMS = 'historyItems';

export type HistoryItem = {
  id: string;
  word: string;
  timestamp: number;
};

export function useHistory(platform: Platform) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;

    const load = async () => {
      const stored = await platform.storage.get<HistoryItem[]>(STORAGE_KEY_HISTORY_ITEMS);
      setItems(Array.isArray(stored) ? stored : []);
      setLoaded(true);
      hasLoadedRef.current = true;
    };

    void load();
  }, [platform]);

  const addItem = (word: string) => {
    const item: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: Date.now(),
      word,
    };

    setItems((prev) => {
      const next = [item, ...prev].slice(0, 200);
      void platform.storage.set(STORAGE_KEY_HISTORY_ITEMS, next);
      return next;
    });
  };

  const clear = () => {
    setItems(() => {
      void platform.storage.set(STORAGE_KEY_HISTORY_ITEMS, []);
      return [];
    });
  };

  return {
    items,
    loaded,
    addItem,
    clear,
  };
}
