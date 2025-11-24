import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { computeEditPlan, type EditPlan } from '../utils/editPlan';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { computeSurvivorMapping } from '../utils/survivorMapping';
import { delay } from '../utils/delay';

export type Phase = 'idle' | 'deleting' | 'moving' | 'inserting' | 'final';

type LetterItem = {
  id: string;    // stable identity key
  char: string;
};

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
  source: string;
  sourceLetters: LetterItem[];
  movingLetters: LetterItem[];
  targetToSourceMap: Map<number, number>;
  plan: EditPlan;
  target: string;
  setState: (state: AnimationState | ((prev: AnimationState) => AnimationState)) => void;
  wait: (ms: number) => Promise<void>;
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
 */
async function performIdlePhase(ctx: AnimationContext): Promise<void> {
  ctx.setState({
    phase: 'idle',
    letters: ctx.sourceLetters,
    deletingIds: new Set(),
  });
}

/**
 * Phase: Deleting
 * Marks characters to be deleted in red, waits for visibility, then removes them.
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
    letters: ctx.sourceLetters,
    deletingIds,
  });
  // ensure frame renders with red before timing
  await new Promise(requestAnimationFrame);
  checkAborted(signal);
  // hold this state for the full deletion duration so red is noticeable
  await ctx.wait(DURATIONS.deleting);
  checkAborted(signal);
  // now remove the deletions to trigger exit animations
  const afterDelete = ctx.sourceLetters.filter((_, i) => !ctx.plan.deletions.includes(i));
  ctx.setState({
    phase: 'deleting',
    letters: afterDelete,
    deletingIds,
  });
  // brief pause to allow exit animations to complete before moving phase
  await ctx.wait(150);
  checkAborted(signal);
}

/**
 * Phase: Moving
 * Reorders surviving characters into their target positions (triggers FLIP animation).
 */
async function performMovingPhase(
  ctx: AnimationContext,
  signal: AbortSignal
): Promise<void> {
  checkAborted(signal);
  ctx.setState({
    phase: 'moving',
    letters: ctx.movingLetters,
    deletingIds: new Set(),
  });
  await ctx.wait(DURATIONS.moving);
  checkAborted(signal);
}

/**
 * Phase: Inserting
 * Adds new characters at their final positions (triggers enter animations).
 */
async function performInsertingPhase(
  ctx: AnimationContext,
  signal: AbortSignal
): Promise<void> {
  checkAborted(signal);
  // Preserve survivors by reusing their original ids; only create ids for new insertions
  const finalLetters: LetterItem[] = [];
  for (let j = 0; j < ctx.target.length; j++) {
    const ch = ctx.target[j];
    const srcIdx = ctx.targetToSourceMap.get(j);
    if (srcIdx !== undefined) {
      finalLetters.push({ id: `src-${srcIdx}`, char: ch });
    } else {
      finalLetters.push({ id: `ins-${j}`, char: ch });
    }
  }
  ctx.setState({
    phase: 'inserting',
    letters: finalLetters,
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

  // Precompute helpers for rendering
  const sourceLetters = useMemo(() => source.split('').map((char, i) => ({ id: `src-${i}`, char })), [source]);
  const { movingLetters, targetToSourceMap } = useMemo(() => {
    const mapping = computeSurvivorMapping(source, target, plan.deletions);
    const movingLetters: LetterItem[] = mapping.mappedLetters.map((m) => ({
      id: `src-${m.fromIndex}`,
      char: m.char,
    }));
    return { movingLetters, targetToSourceMap: mapping.targetToSourceMap };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, target, plan.deletions.join(',')]);

  // Consolidated animation state
  const [animationState, setAnimationState] = useState<AnimationState>({
    phase: 'idle',
    letters: sourceLetters,
    deletingIds: new Set(),
  });

  const runningRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset animation state when source or target changes
  useEffect(() => {
    setAnimationState({
      phase: 'idle',
      letters: sourceLetters,
      deletingIds: new Set(),
    });
  }, [source, target, sourceLetters]);

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
          maxDuration: prefersReduced ? 50 : undefined,
        });

      // Build animation context
      const ctx: AnimationContext = {
        source,
        sourceLetters,
        movingLetters,
        targetToSourceMap,
        plan,
        target,
        setState: setAnimationState,
        wait,
      };

      try {
        // Execute animation phases in sequence, skipping empty phases
        await performIdlePhase(ctx);
        
        // Only run deleting phase if there are deletions
        if (ctx.plan.deletions.length > 0) {
          await performDeletingPhase(ctx, signal);
        }
        
        // Run moving phase if letters need to reorder (survivors exist and source != target)
        // This handles both explicit moves and anagram cases
        if (ctx.movingLetters.length > 0 && ctx.source !== ctx.target) {
          await performMovingPhase(ctx, signal);
        }
        
        // Only run inserting phase if there are insertions
        if (ctx.plan.insertions.length > 0) {
          await performInsertingPhase(ctx, signal);
        }
        
        await performFinalPhase(ctx);

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
      letters: sourceLetters,
      deletingIds: new Set(),
    });
    // do not call onAnimationStart/Complete
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal, sourceLetters]);

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
      const idx = parseInt(item.id.split('-')[1] || '-1', 10);
      const isTrueMover = plan.moves.some((m) => m.fromIndex === idx) || plan.highlightIndices.includes(idx);
      return isTrueMover ? 'text-move' : '';
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
              transition={{ duration: (prefersReduced ? 0.05 : 0.25) * SPEED_MULTIPLIER }}
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
