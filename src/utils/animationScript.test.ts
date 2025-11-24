import { describe, it, expect } from 'vitest';
import { computeEditPlan } from './editPlan';
import { buildAnimationScript } from './animationScript';
import type { PhaseDurations } from '../types/animation';

const DURATIONS: PhaseDurations = {
  idle: 0,
  deleting: 400,
  moving: 1000,
  inserting: 300,
  final: 0,
};

describe('buildAnimationScript', () => {
  it('produces frames for deleting → moving → inserting sequences', () => {
    const plan = computeEditPlan('tesd', 'tads');
    const frames = buildAnimationScript(plan, {
      durations: DURATIONS,
      deletionHoldMs: 100,
    });

    const phaseOrder = frames.map((f) => f.phase);
    expect(phaseOrder).toEqual(['idle', 'deleting', 'deleting', 'moving', 'inserting', 'final']);
    // Ensure deletion frames carry correct IDs
    const deletingFrames = frames.filter((f) => f.phase === 'deleting');
    expect(deletingFrames).toHaveLength(2);
    expect(deletingFrames[0].deletingIds).toContain('src-1'); // 'e' removed at index 1
  });

  it('skips unnecessary phases for anagrams', () => {
    const plan = computeEditPlan('tasd', 'tads');
    const frames = buildAnimationScript(plan, {
      durations: DURATIONS,
      deletionHoldMs: 100,
    });

    const phaseOrder = frames.map((f) => f.phase);
    expect(phaseOrder).toEqual(['idle', 'moving', 'final']);
  });
});
