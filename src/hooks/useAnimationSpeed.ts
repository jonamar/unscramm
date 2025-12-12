import { useState, useEffect } from 'react';
import type { AnimationSpeed } from '../components/SpeedSelector';
import type { Platform } from '../platform/types';

const STORAGE_KEY = 'animationSpeed';
const DEFAULT_SPEED: AnimationSpeed = 'turtle';

export function useAnimationSpeed(platform: Platform) {
  const [speed, setSpeed] = useState<AnimationSpeed>(DEFAULT_SPEED);
  const [speedLoaded, setSpeedLoaded] = useState(false);

  // Load animation speed preference from storage on mount
  useEffect(() => {
    const loadSpeed = async () => {
      try {
        const savedSpeed = await platform.storage.get<AnimationSpeed>(STORAGE_KEY);
        if (savedSpeed) {
          setSpeed(savedSpeed);
        }
        setSpeedLoaded(true);
      } catch (error) {
        console.error('Failed to load speed preference:', error);
        setSpeedLoaded(true);
      }
    };
    loadSpeed();
  }, [platform]);

  // Save animation speed preference to storage whenever it changes
  useEffect(() => {
    if (!speedLoaded) return; // Don't save until we've loaded the initial value

    const saveSpeed = async () => {
      try {
        await platform.storage.set(STORAGE_KEY, speed);
      } catch (error) {
        console.error('Failed to save speed preference:', error);
      }
    };
    saveSpeed();
  }, [speed, speedLoaded, platform]);

  return [speed, setSpeed] as const;
}
