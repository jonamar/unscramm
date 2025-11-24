import { useState, useEffect } from 'react';
import type { AnimationSpeed } from '../components/SpeedSelector';

export function useAnimationSpeed() {
  const [speed, setSpeed] = useState<AnimationSpeed>('turtle');
  const [speedLoaded, setSpeedLoaded] = useState(false);

  // Load animation speed preference from storage on mount
  useEffect(() => {
    const loadSpeed = async () => {
      // Check if chrome.storage API is available (extension context)
      if (typeof chrome === 'undefined' || !chrome.storage) {
        setSpeedLoaded(true);
        return;
      }

      try {
        const result = await chrome.storage.local.get({ animationSpeed: 'turtle' });
        setSpeed(result.animationSpeed as AnimationSpeed);
        setSpeedLoaded(true);
      } catch (error) {
        console.error('Failed to load speed preference:', error);
        setSpeedLoaded(true);
      }
    };
    loadSpeed();
  }, []);

  // Save animation speed preference to storage whenever it changes
  useEffect(() => {
    if (!speedLoaded) return; // Don't save until we've loaded the initial value
    
    // Check if chrome.storage API is available (extension context)
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }

    const saveSpeed = async () => {
      try {
        await chrome.storage.local.set({ animationSpeed: speed });
      } catch (error) {
        console.error('Failed to save speed preference:', error);
      }
    };
    saveSpeed();
  }, [speed, speedLoaded]);

  return [speed, setSpeed] as const;
}
