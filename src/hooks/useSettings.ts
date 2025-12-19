import { useState, useEffect, useRef } from 'react';
import type { Platform } from '../platform/types';

const STORAGE_KEY_AUTOPASTE = 'autoPasteEnabled';
const STORAGE_KEY_ONBOARDED = 'hasSeenOnboarding';
const STORAGE_KEY_HISTORY_ENABLED = 'historyEnabled';

export interface Settings {
  autoPasteEnabled: boolean;
  hasSeenOnboarding: boolean;
  historyEnabled: boolean;
}

export function useSettings(platform: Platform) {
  const [settings, setSettings] = useState<Settings>({
    autoPasteEnabled: false,
    hasSeenOnboarding: false,
    historyEnabled: false,
  });
  const [loaded, setLoaded] = useState(false);
  const hasLoadedRef = useRef(false);

  // Load settings from storage on mount (only once)
  useEffect(() => {
    console.log('[useSettings] useEffect triggered, hasLoadedRef=', hasLoadedRef.current);
    if (hasLoadedRef.current) {
      console.log('[useSettings] skipping load, already loaded');
      return;
    }
    
    const loadSettings = async () => {
      try {
        console.log('[useSettings] loading settings from storage...');
        const [autoPaste, onboarded, historyEnabled] = await Promise.all([
          platform.storage.get<boolean>(STORAGE_KEY_AUTOPASTE),
          platform.storage.get<boolean>(STORAGE_KEY_ONBOARDED),
          platform.storage.get<boolean>(STORAGE_KEY_HISTORY_ENABLED),
        ]);
        console.log('[useSettings] loaded:', { autoPaste, onboarded, historyEnabled });
        setSettings({
          autoPasteEnabled: autoPaste ?? false,
          hasSeenOnboarding: onboarded ?? false,
          historyEnabled: historyEnabled ?? false,
        });
        setLoaded(true);
        hasLoadedRef.current = true;
      } catch (error) {
        console.error('Failed to load settings:', error);
        setLoaded(true);
        hasLoadedRef.current = true;
      }
    };
    loadSettings();
  }, [platform]);

  const setAutoPasteEnabled = async (enabled: boolean) => {
    console.log('[useSettings] setAutoPasteEnabled called with:', enabled);
    setSettings((prev) => {
      console.log('[useSettings] updating state from', prev.autoPasteEnabled, 'to', enabled);
      return { ...prev, autoPasteEnabled: enabled };
    });
    try {
      await platform.storage.set(STORAGE_KEY_AUTOPASTE, enabled);
      console.log('[useSettings] storage.set completed');
    } catch (error) {
      console.error('Failed to save autoPaste setting:', error);
    }
  };

  const setHasSeenOnboarding = async (seen: boolean) => {
    setSettings((prev) => ({ ...prev, hasSeenOnboarding: seen }));
    try {
      await platform.storage.set(STORAGE_KEY_ONBOARDED, seen);
    } catch (error) {
      console.error('Failed to save onboarding setting:', error);
    }
  };

  const setHistoryEnabled = async (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, historyEnabled: enabled }));
    try {
      await platform.storage.set(STORAGE_KEY_HISTORY_ENABLED, enabled);
    } catch (error) {
      console.error('Failed to save history setting:', error);
    }
  };

  return {
    settings,
    loaded,
    setAutoPasteEnabled,
    setHasSeenOnboarding,
    setHistoryEnabled,
  };
}
