import type { PhaseDurations } from '../types/animation';
import type { EditPlan } from './editPlan';

/**
 * Base timing constants for animation phases.
 * These are the per-operation durations that get multiplied by operation count.
 */
export const TIMING = {
  /** Base duration per deletion operation (ms) */
  deletePerOp: 150,
  /** Minimum delete phase duration (ms) */
  deleteMin: 200,
  /** Buffer after deletions complete (ms) */
  deleteBuffer: 150,

  /** Base duration per move operation (ms) */
  movePerOp: 300,
  /** Minimum move phase duration (ms) */
  moveMin: 400,
  /** Buffer after moves complete (ms) */
  moveBuffer: 200,

  /** Base duration per insertion operation (ms) */
  insertPerOp: 150,
  /** Minimum insert phase duration (ms) */
  insertMin: 200,
  /** Buffer after insertions complete (ms) */
  insertBuffer: 100,

  /** Per-letter motion transition duration (ms) - controls framer-motion speed */
  motionPerLetter: 250,

  /** Hold time after deletion visual exit before removing from DOM (ms) */
  deletionExitDelay: 150,
};

/**
 * Computes phase durations based on the edit plan's operation counts.
 * Duration = max(minimum, perOp * count) + buffer
 */
export function computePhaseDurations(plan: EditPlan): PhaseDurations {
  const deleteCount = plan.deletions.length;
  const moveCount = plan.moves.length;
  const insertCount = plan.insertions.length;

  return {
    idle: 0,
    deleting: deleteCount > 0
      ? Math.max(TIMING.deleteMin, TIMING.deletePerOp * deleteCount) + TIMING.deleteBuffer
      : 0,
    moving: moveCount > 0
      ? Math.max(TIMING.moveMin, TIMING.movePerOp * moveCount) + TIMING.moveBuffer
      : TIMING.moveMin, // Still need time for layout shift even with no "moves"
    inserting: insertCount > 0
      ? Math.max(TIMING.insertMin, TIMING.insertPerOp * insertCount) + TIMING.insertBuffer
      : 0,
    final: 0,
  };
}

/**
 * Default speed multiplier applied to all timings.
 * Higher = slower animation (multiplies delays).
 */
export const DEFAULT_SPEED_MULTIPLIER = 2.5;

/**
 * Speed presets for the speed selector.
 */
export const SPEED_PRESETS = {
  snail: 4,   // 4x slower (0.25x speed)
  turtle: 2,  // 2x slower (0.5x speed)
  rabbit: 1,  // 1x normal speed
} as const;

export type SpeedPreset = keyof typeof SPEED_PRESETS;
