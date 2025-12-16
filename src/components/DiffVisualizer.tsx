import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { computeEditPlan, type PlanLetter } from '../utils/editPlan';
import { buildAnimationScript, type AnimationFrame } from '../utils/animationScript';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { delay } from '../utils/delay';
import { TIMING, DEFAULT_SPEED_MULTIPLIER } from '../utils/animationTiming';
import type { Phase } from '../types/animation';

type LetterItem = PlanLetter;

/**
 * Consolidated animation state.
 * All visual state for the current animation phase.
 */
interface AnimationState {
  phase: Phase;
  letters: LetterItem[];
  deletingIds: Set<string>;
}

/**
 * Props for the DiffVisualizer component.
 *
 * This component visualizes the transformation between any two text strings
 * by animating character deletions, movements, and insertions. Perfect for:
 * - Spell-checking visualizations (e.g., "recieve" → "receive")
 * - Text correction demonstrations
 * - Educational tools showing text transformations
 * - Browser extension content highlighting
 */
export interface TimingConfig {
  deletePerOp: number;
  deleteMin: number;
  deleteBuffer: number;
  movePerOp: number;
  moveMin: number;
  moveBuffer: number;
  insertPerOp: number;
  insertMin: number;
  insertBuffer: number;
  motionPerLetter: number;
  deletionExitDelay: number;
}

export interface DiffVisualizerProps {
  /** The source text (e.g., misspelled word) */
  source: string;
  /** The target text (e.g., correct spelling) */
  target: string;
  /** Increment this number to trigger a new animation */
  animateSignal: number;
  /** Optional: Increment to reset to initial state without animating */
  resetSignal?: number;
  /** Optional callback when animation starts */
  onAnimationStart?: () => void;
  /** Optional callback when animation completes */
  onAnimationComplete?: () => void;
  /** Optional callback for phase changes (useful for status indicators) */
  onPhaseChange?: (phase: Phase) => void;
  /** Optional speed multiplier for animation (default: 2.5) */
  speedMultiplier?: number;
  /** Optional timing config overrides for dev/testing */
  timingOverrides?: TimingConfig;
}


/**
 * Checks if the animation has been aborted.
 * Throws an error if aborted, allowing early exit from async phase functions.
 */
function checkAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException('Animation aborted', 'AbortError');
  }
}

async function playAnimationScript(
  frames: AnimationFrame[],
  setState: (state: AnimationState | ((prev: AnimationState) => AnimationState)) => void,
  wait: (ms: number) => Promise<void>,
  signal: AbortSignal
): Promise<void> {
  for (const frame of frames) {
    checkAborted(signal);
    setState({
      phase: frame.phase,
      letters: frame.letters,
      deletingIds: new Set(frame.deletingIds),
    });
    // ensure DOM paints before waiting for duration
    await new Promise(requestAnimationFrame);
    checkAborted(signal);
    await wait(frame.duration);
  }
}

/**
 * DiffVisualizer - Generic text diff animation component
 *
 * Visualizes the transformation between any two text strings through
 * a multi-phase animation showing deletions, movements, and insertions.
 *
 * Designed for:
 * - Spell-checking visualizations
 * - Text correction demos
 * - Educational tools
 * - Browser extensions (content script injection)
 *
 * Features:
 * - Smooth FLIP animations for character movement
 * - AbortController-based cancellation (matches browser APIs)
 * - Respects prefers-reduced-motion
 * - Atomic state updates
 * - Phase-based callbacks
 *
 * @example
 * ```tsx
 * <DiffVisualizer
 *   source="recieve"
 *   target="receive"
 *   animateSignal={animateCount}
 *   onAnimationComplete={() => console.log('Done!')}
 * />
 * ```
 */
export default function DiffVisualizer({
  source,
  target,
  animateSignal,
  resetSignal,
  onAnimationStart,
  onAnimationComplete,
  onPhaseChange,
  speedMultiplier = DEFAULT_SPEED_MULTIPLIER,
  timingOverrides,
}: DiffVisualizerProps) {
  const prefersReduced = usePrefersReducedMotion();
  const plan = useMemo(() => computeEditPlan(source, target), [source, target]);
  const timing = timingOverrides ?? TIMING;
  const clampDuration = useMemo(
    () => (ms: number) => (prefersReduced ? Math.min(ms, 50) : ms),
    [prefersReduced]
  );
  const motionTransitionSeconds = useMemo(
    () => (clampDuration(timing.motionPerLetter) / 1000) * speedMultiplier,
    [clampDuration, speedMultiplier, timing.motionPerLetter]
  );

  const animationFrames = useMemo(() => {
    const deleteCount = plan.deletions.length;
    const moveCount = plan.moves.length;
    const insertCount = plan.insertions.length;

    const baseDurations = {
      idle: 0,
      deleting: deleteCount > 0
        ? Math.max(timing.deleteMin, timing.deletePerOp * deleteCount) + timing.deleteBuffer
        : 0,
      moving: moveCount > 0
        ? Math.max(timing.moveMin, timing.movePerOp * moveCount) + timing.moveBuffer
        : timing.moveMin,
      inserting: insertCount > 0
        ? Math.max(timing.insertMin, timing.insertPerOp * insertCount) + timing.insertBuffer
        : 0,
      final: 0,
    };

    const clampedDurations = {
      idle: clampDuration(baseDurations.idle),
      deleting: clampDuration(baseDurations.deleting),
      moving: clampDuration(baseDurations.moving),
      inserting: clampDuration(baseDurations.inserting),
      final: clampDuration(baseDurations.final),
    };
    return buildAnimationScript(plan, {
      durations: clampedDurations,
      deletionHoldMs: clampDuration(timing.deletionExitDelay),
    });
  }, [plan, clampDuration, timing]);

  const moverIds = useMemo(() => {
    const ids = new Set<string>();
    plan.moves.forEach((m) => ids.add(`src-${m.fromIndex}`));
    plan.highlightIndices.forEach((idx) => ids.add(`src-${idx}`));
    return ids;
  }, [plan]);

  // Consolidated animation state
  const [animationState, setAnimationState] = useState<AnimationState>(() => {
    const firstFrame = animationFrames[0];
    return {
      phase: firstFrame?.phase ?? 'idle',
      letters: firstFrame?.letters ?? plan.letters.idle,
      deletingIds: new Set(firstFrame?.deletingIds ?? []),
    };
  });

  const runningRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset animation state when source or target changes
  useEffect(() => {
    const firstFrame = animationFrames[0];
    setAnimationState({
      phase: firstFrame?.phase ?? 'idle',
      letters: firstFrame?.letters ?? plan.letters.idle,
      deletingIds: new Set(firstFrame?.deletingIds ?? []),
    });
  }, [plan, animationFrames]);

  // Orchestrate phases when animateSignal changes
  useEffect(() => {
    if (animateSignal <= 0) return; // only run when explicitly triggered via Play

    const runAnimation = async () => {
      if (runningRef.current) return; // prevent overlap
      runningRef.current = true;

      // Create new AbortController for this animation run
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      onAnimationStart?.();

      // Helper to delay with speed multiplier and reduced motion support
      const wait = (ms: number) =>
        delay(ms, {
          speedMultiplier,
          maxDuration: clampDuration(ms),
        });

      try {
        // Execute animation frames produced by the animation script
        await playAnimationScript(animationFrames, setAnimationState, wait, signal);

        onAnimationComplete?.();
      } catch (error) {
        // If aborted, silently exit without calling onAnimationComplete
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        // Re-throw unexpected errors
        throw error;
      } finally {
        runningRef.current = false;
      }
    };

    runAnimation();

    return () => {
      // Abort animation on cleanup
      abortControllerRef.current?.abort();
      runningRef.current = false;
    };
  }, [animateSignal, animationFrames, clampDuration, onAnimationComplete, onAnimationStart, speedMultiplier]);

  // Handle external reset without animating
  useEffect(() => {
    if (resetSignal === undefined) return;
    // Bring the view back to the initial state instantly
    abortControllerRef.current?.abort(); // cancel any in-flight animation
    runningRef.current = false;
    const firstFrame = animationFrames[0];
    setAnimationState({
      phase: firstFrame?.phase ?? 'idle',
      letters: firstFrame?.letters ?? plan.letters.idle,
      deletingIds: new Set(firstFrame?.deletingIds ?? []),
    });
    // do not call onAnimationStart/Complete
  }, [resetSignal, plan, animationFrames]);

  // Notify parent when phase changes
  useEffect(() => {
    onPhaseChange?.(animationState.phase);
  }, [animationState.phase, onPhaseChange]);

  // Styling variants
  const getLetterClass = (item: LetterItem): string => {
    const { phase, deletingIds } = animationState;

    if (phase === 'deleting') {
      // only characters being removed should be red
      return deletingIds.has(item.id) ? 'text-deletion' : '';
    }
    if (phase === 'inserting') {
      // only newly inserted characters should be green
      return item.id.startsWith('ins-') ? 'text-insertion' : '';
    }
    if (phase === 'moving') {
      // highlight true movers using plan.moves (fromIndex)
      return moverIds.has(item.id) ? 'text-move' : '';
    }
    return '';
  };

  const { phase, letters } = animationState;

  return (
    <div className="w-full max-w-[360px] box-border">
      <div className="flex w-full justify-center gap-[0.025em] text-white text-[1.5rem] select-none">
        <AnimatePresence initial={false}>
          {letters.map((l) => (
            <motion.span
              layout
              key={l.id}
              initial={{ opacity: phase === 'inserting' ? 0 : 1, y: phase === 'inserting' ? 10 : 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: phase === 'deleting' ? 0 : 1, scale: phase === 'deleting' ? 0.8 : 1 }}
              transition={{ duration: motionTransitionSeconds }}
              className={getLetterClass(l)}
              data-testid="letter"
            >
              {l.char}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
