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
 * Context shared across all animation phases.
 * Contains the computed data and state setters needed to orchestrate the animation.
 */
interface AnimationContext {
  sourceLetters: LetterItem[];
  movingLetters: LetterItem[];
  targetToSourceMap: Map<number, number>;
  plan: EditPlan;
  target: string;
  setPhase: (phase: Phase) => void;
  setLetters: (letters: LetterItem[]) => void;
  deletingIdsRef: React.MutableRefObject<Set<string>>;
  wait: (ms: number) => Promise<void>;
}

export interface WordUnscramblerProps {
  source: string;
  target: string;
  animateSignal: number; // increment to re-run animation
  resetSignal?: number; // increment to reset to initial state without animating
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
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
 * Renders the initial source word before animation begins.
 */
async function performIdlePhase(ctx: AnimationContext): Promise<void> {
  ctx.setPhase('idle');
  ctx.setLetters(ctx.sourceLetters);
}

/**
 * Phase: Deleting
 * Marks letters to be deleted in red, waits for visibility, then removes them.
 */
async function performDeletingPhase(
  ctx: AnimationContext,
  signal: AbortSignal
): Promise<void> {
  checkAborted(signal);
  ctx.setPhase('deleting');
  // mark to-be-deleted ids and keep them visible in red for the whole deletion duration
  ctx.deletingIdsRef.current = new Set(ctx.plan.deletions.map((i) => `src-${i}`));
  // ensure frame renders with red before timing
  await new Promise(requestAnimationFrame);
  checkAborted(signal);
  // hold this state for the full deletion duration so red is noticeable
  await ctx.wait(DURATIONS.deleting);
  checkAborted(signal);
  // now remove the deletions to trigger exit animations
  const afterDelete = ctx.sourceLetters.filter((_, i) => !ctx.plan.deletions.includes(i));
  ctx.setLetters(afterDelete);
  // brief pause to allow exit animations to complete before moving phase
  await ctx.wait(150);
  checkAborted(signal);
}

/**
 * Phase: Moving
 * Reorders surviving letters into their target positions (triggers FLIP animation).
 */
async function performMovingPhase(
  ctx: AnimationContext,
  signal: AbortSignal
): Promise<void> {
  checkAborted(signal);
  ctx.setPhase('moving');
  ctx.setLetters(ctx.movingLetters);
  await ctx.wait(DURATIONS.moving);
  checkAborted(signal);
}

/**
 * Phase: Inserting
 * Adds new letters at their final positions (triggers enter animations).
 */
async function performInsertingPhase(
  ctx: AnimationContext,
  signal: AbortSignal
): Promise<void> {
  checkAborted(signal);
  ctx.setPhase('inserting');
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
  ctx.setLetters(finalLetters);
  await ctx.wait(DURATIONS.inserting);
  checkAborted(signal);
}

/**
 * Phase: Final
 * Animation complete, returns control to the component.
 */
async function performFinalPhase(ctx: AnimationContext): Promise<void> {
  ctx.setPhase('final');
}

export default function WordUnscrambler({
  source,
  target,
  animateSignal,
  resetSignal,
  onAnimationStart,
  onAnimationComplete,
  onPhaseChange,
}: WordUnscramblerProps) {
  const prefersReduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('idle');
  const runningRef = useRef(false);
  const deletingIdsRef = useRef<Set<string>>(new Set());

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

  const [letters, setLetters] = useState<LetterItem[]>(sourceLetters);
  const abortControllerRef = useRef<AbortController | null>(null);

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
        sourceLetters,
        movingLetters,
        targetToSourceMap,
        plan,
        target,
        setPhase,
        setLetters,
        deletingIdsRef,
        wait,
      };

      try {
        // Execute animation phases in sequence
        await performIdlePhase(ctx);
        await performDeletingPhase(ctx, signal);
        await performMovingPhase(ctx, signal);
        await performInsertingPhase(ctx, signal);
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
    setPhase('idle');
    setLetters(sourceLetters);
    // do not call onAnimationStart/Complete
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal, sourceLetters]);

  // Notify parent when phase changes
  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  // Styling variants
  const getLetterClass = (item: LetterItem): string => {
    if (phase === 'deleting') {
      // only letters being removed should be red
      return deletingIdsRef.current.has(item.id) ? 'text-deletion' : '';
    }
    if (phase === 'inserting') {
      // only newly inserted letters should be green
      return item.id.startsWith('ins-') ? 'text-insertion' : '';
    }
    if (phase === 'moving') {
      // highlight true movers using plan.moves (fromIndex)
      const idx = parseInt(item.id.split('-')[1] || '-1', 10);
      const isTrueMover = plan.moves.some(m => m.fromIndex === idx) || plan.highlightIndices.includes(idx);
      return isTrueMover ? 'text-move' : '';
    }
    return '';
  };

  return (
    <div className="w-full max-w-[600px] px-6 box-border">
      <div className="flex w-full justify-center gap-[0.025em] text-white text-[2rem] select-none">
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
