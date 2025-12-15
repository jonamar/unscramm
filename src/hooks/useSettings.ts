import { useState, useEffect, useRef } from 'react';
import type { Platform } from '../platform/types';

const STORAGE_KEY_AUTOPASTE = 'autoPasteEnabled';
const STORAGE_KEY_ONBOARDED = 'hasSeenOnboarding';

export interface Settings {
  autoPasteEnabled: boolean;
  hasSeenOnboarding: boolean;
}

export function useSettings(platform: Platform) {
  const [settings, setSettings] = useState<Settings>({
    autoPasteEnabled: false,
    hasSeenOnboarding: false,
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
        const [autoPaste, onboarded] = await Promise.all([
          platform.storage.get<boolean>(STORAGE_KEY_AUTOPASTE),
          platform.storage.get<boolean>(STORAGE_KEY_ONBOARDED),
        ]);
        console.log('[useSettings] loaded:', { autoPaste, onboarded });
        setSettings({
          autoPasteEnabled: autoPaste ?? false,
          hasSeenOnboarding: onboarded ?? false,
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

  return {
    settings,
    loaded,
    setAutoPasteEnabled,
    setHasSeenOnboarding,
  };
}
