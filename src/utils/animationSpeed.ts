export type AnimationSpeed = 'snail' | 'turtle' | 'rabbit';

export const SPEED_MULTIPLIERS: Record<AnimationSpeed, number> = {
  snail: 4,
  turtle: 2,
  rabbit: 1,
};

export function getSpeedMultiplier(speed: AnimationSpeed): number {
  return SPEED_MULTIPLIERS[speed];
}
