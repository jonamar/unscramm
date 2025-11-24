import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { computeEditPlan, type EditPlan, type PlanLetter } from '../utils/editPlan';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { delay } from '../utils/delay';

export type Phase = 'idle' | 'deleting' | 'moving' | 'inserting' | 'final';

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
 * Context shared across all animation phases.
 * Contains the computed data and state setters needed to orchestrate the animation.
 */
interface AnimationContext {
  plan: EditPlan;
  setState: (state: AnimationState | ((prev: AnimationState) => AnimationState)) => void;
  wait: (ms: number) => Promise<void>;
}

interface PhaseDefinition {
  name: Phase;
  shouldRun: (plan: EditPlan) => boolean;
  run: (ctx: AnimationContext, signal: AbortSignal) => Promise<void>;
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
}

const DURATIONS: Record<Phase, number> = {
  idle: 0,
  deleting: 400,
  moving: 1000,
  inserting: 300,
  final: 0,
};

// Debug/inspection: slow down all timings (phase delays and per-letter transitions)
// Set to 1 for normal speed. Current debugging value halved to 2.5 to run 2x faster than before.
const SPEED_MULTIPLIER = 2.5;

/**
 * Checks if the animation has been aborted.
 * Throws an error if aborted, allowing early exit from async phase functions.
 */
function checkAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException('Animation aborted', 'AbortError');
  }
}

/**
 * Phase: Idle
 * Renders the initial source text before animation begins.
 *
 * Requires: plan.letters.idle to contain the source characters with stable ids.
 */
async function performIdlePhase(ctx: AnimationContext): Promise<void> {
  ctx.setState({
    phase: 'idle',
    letters: ctx.plan.letters.idle,
    deletingIds: new Set(),
  });
}

/**
 * Phase: Deleting
 * Marks characters to be deleted in red, waits for visibility, then removes them.
 *
 * Requires: plan.deletions + plan.letters.idle (pre-delete) and plan.letters.afterDelete (post-delete) snapshots.
 */
async function performDeletingPhase(
  ctx: AnimationContext,
  signal: AbortSignal
): Promise<void> {
  checkAborted(signal);
  // mark to-be-deleted ids and keep them visible in red for the whole deletion duration
  const deletingIds = new Set(ctx.plan.deletions.map((i) => `src-${i}`));
  ctx.setState({
    phase: 'deleting',
    letters: ctx.plan.letters.idle,
    deletingIds,
  });
  // ensure frame renders with red before timing
  await new Promise(requestAnimationFrame);
  checkAborted(signal);
  // hold this state for the full deletion duration so red is noticeable
  await ctx.wait(DURATIONS.deleting);
  checkAborted(signal);
  // now remove the deletions to trigger exit animations
  ctx.setState({
    phase: 'deleting',
    letters: ctx.plan.letters.afterDelete,
    deletingIds,
  });
  // brief pause to allow exit animations to complete before moving phase
  await ctx.wait(150);
  checkAborted(signal);
}

/**
 * Phase: Moving
 * Reorders surviving characters into their target positions (triggers FLIP animation).
 *
 * Requires: plan.letters.moving sorted by target positions of survivor pairs.
 */
async function performMovingPhase(
  ctx: AnimationContext,
  signal: AbortSignal
): Promise<void> {
  checkAborted(signal);
  ctx.setState({
    phase: 'moving',
    letters: ctx.plan.letters.moving,
    deletingIds: new Set(),
  });
  await ctx.wait(DURATIONS.moving);
  checkAborted(signal);
}

/**
 * Phase: Inserting
 * Adds new characters at their final positions (triggers enter animations).
 *
 * Requires: plan.letters.final (target order with survivor ids + insertion ids).
 */
async function performInsertingPhase(
  ctx: AnimationContext,
  signal: AbortSignal
): Promise<void> {
  checkAborted(signal);
  ctx.setState({
    phase: 'inserting',
    letters: ctx.plan.letters.final,
    deletingIds: new Set(),
  });
  await ctx.wait(DURATIONS.inserting);
  checkAborted(signal);
}

/**
 * Phase: Final
 * Animation complete, returns control to the component.
 */
async function performFinalPhase(ctx: AnimationContext): Promise<void> {
  // Phase transitions to 'final' while keeping current letters
  // We use a functional update to preserve the current letters from inserting phase
  ctx.setState((prev) => ({
    ...prev,
    phase: 'final',
  }));
}

const PHASES: PhaseDefinition[] = [
  {
    name: 'idle',
    shouldRun: () => true,
    run: (ctx) => performIdlePhase(ctx),
  },
  {
    name: 'deleting',
    shouldRun: (plan) => plan.shouldDelete,
    run: performDeletingPhase,
  },
  {
    name: 'moving',
    shouldRun: (plan) => plan.shouldMove,
    run: performMovingPhase,
  },
  {
    name: 'inserting',
    shouldRun: (plan) => plan.shouldInsert,
    run: performInsertingPhase,
  },
  {
    name: 'final',
    shouldRun: () => true,
    run: (ctx) => performFinalPhase(ctx),
  },
];

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
}: DiffVisualizerProps) {
  const prefersReduced = usePrefersReducedMotion();
  const plan = useMemo(() => computeEditPlan(source, target), [source, target]);
  const clampDuration = useMemo(
    () => (ms: number) => (prefersReduced ? Math.min(ms, 50) : ms),
    [prefersReduced]
  );
  const baseMotionDurationMs = 250;
  const motionTransitionSeconds = useMemo(
    () => (clampDuration(baseMotionDurationMs) / 1000) * SPEED_MULTIPLIER,
    [clampDuration]
  );

  const moverIds = useMemo(() => {
    const ids = new Set<string>();
    plan.moves.forEach((m) => ids.add(`src-${m.fromIndex}`));
    plan.highlightIndices.forEach((idx) => ids.add(`src-${idx}`));
    return ids;
  }, [plan]);

  // Consolidated animation state
  const [animationState, setAnimationState] = useState<AnimationState>({
    phase: 'idle',
    letters: plan.letters.idle,
    deletingIds: new Set(),
  });

  const runningRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset animation state when source or target changes
  useEffect(() => {
    setAnimationState({
      phase: 'idle',
      letters: plan.letters.idle,
      deletingIds: new Set(),
    });
  }, [plan]);

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
          speedMultiplier: SPEED_MULTIPLIER,
          maxDuration: clampDuration(ms),
        });

      // Build animation context
      const ctx: AnimationContext = {
        plan,
        setState: setAnimationState,
        wait,
      };

      try {
        // Execute animation phases in sequence based on declarative config
        for (const phase of PHASES) {
          if (!phase.shouldRun(ctx.plan)) continue;
          await phase.run(ctx, signal);
        }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateSignal]);

  // Handle external reset without animating
  useEffect(() => {
    if (resetSignal === undefined) return;
    // Bring the view back to the initial state instantly
    abortControllerRef.current?.abort(); // cancel any in-flight animation
    runningRef.current = false;
    setAnimationState({
      phase: 'idle',
      letters: plan.letters.idle,
      deletingIds: new Set(),
    });
    // do not call onAnimationStart/Complete
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal, plan]);

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
    <div className="w-full max-w-[360px] px-4 box-border">
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
