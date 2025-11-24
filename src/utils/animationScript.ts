import type { EditPlan, PlanLetter } from './editPlan';
import type { Phase, PhaseDurations } from '../types/animation';

export interface AnimationFrame {
  phase: Phase;
  letters: PlanLetter[];
  deletingIds: string[];
  duration: number;
}

export interface BuildAnimationScriptOptions {
  durations: PhaseDurations;
  deletionHoldMs: number;
}

function createFrame(
  phase: Phase,
  letters: PlanLetter[],
  duration: number,
  deletingIds: string[] = []
): AnimationFrame {
  return { phase, letters, deletingIds, duration };
}

export function buildAnimationScript(
  plan: EditPlan,
  options: BuildAnimationScriptOptions
): AnimationFrame[] {
  const frames: AnimationFrame[] = [];
  const { durations, deletionHoldMs } = options;

  frames.push(createFrame('idle', plan.letters.idle, durations.idle));

  if (plan.shouldDelete) {
    const deletingIds = plan.deletions.map((i) => `src-${i}`);
    frames.push(createFrame('deleting', plan.letters.idle, durations.deleting, deletingIds));
    frames.push(createFrame('deleting', plan.letters.afterDelete, deletionHoldMs, deletingIds));
  }

  if (plan.shouldMove) {
    frames.push(createFrame('moving', plan.letters.moving, durations.moving));
  }

  if (plan.shouldInsert) {
    frames.push(createFrame('inserting', plan.letters.final, durations.inserting));
  }

  frames.push(createFrame('final', plan.letters.final, durations.final));

  return frames;
}
