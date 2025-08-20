import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { computeEditPlan } from '../utils/editPlan';

export type Phase = 'idle' | 'deleting' | 'moving' | 'inserting' | 'final';

type LetterItem = {
  id: string;    // stable identity key
  char: string;
};

export interface WordUnscramblerProps {
  source: string;
  target: string;
  animateSignal: number; // increment to re-run animation
  resetSignal?: number; // increment to reset to initial state without animating
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
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

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

export default function WordUnscrambler({
  source,
  target,
  animateSignal,
  resetSignal,
  onAnimationStart,
  onAnimationComplete,
}: WordUnscramblerProps) {
  const prefersReduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('idle');
  const runningRef = useRef(false);
  const deletingIdsRef = useRef<Set<string>>(new Set());

  const plan = useMemo(() => computeEditPlan(source, target), [source, target]);

  // Precompute helpers for rendering
  const sourceLetters = useMemo(() => source.split('').map((char, i) => ({ id: `src-${i}`, char })), [source]);
  const { movingLetters, targetToSourceMap } = useMemo(() => {
    // Build survivors (source indices not deleted)
    const survivors: number[] = [];
    for (let i = 0; i < source.length; i++) {
      if (!plan.deletions.includes(i)) survivors.push(i);
    }
    // Greedy map target positions to next unused survivor with same char
    const used = new Set<number>();
    const mapped: { fromIndex: number; toIndex: number; char: string }[] = [];
    const t2s = new Map<number, number>(); // target index -> source index
    for (let t = 0; t < target.length; t++) {
      const c = target[t];
      let found = -1;
      for (const sIdx of survivors) {
        if (!used.has(sIdx) && source[sIdx] === c) { found = sIdx; break; }
      }
      if (found >= 0) {
        used.add(found);
        mapped.push({ fromIndex: found, toIndex: t, char: c });
        t2s.set(t, found);
      }
    }
    mapped.sort((a, b) => a.toIndex - b.toIndex);
    const movingLetters: LetterItem[] = mapped.map(m => ({ id: `src-${m.fromIndex}`, char: m.char }));
    return { movingLetters, targetToSourceMap: t2s };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, target, plan.deletions.join(',')]);

  const [letters, setLetters] = useState<LetterItem[]>(sourceLetters);

  // Orchestrate phases when animateSignal changes
  useEffect(() => {
    if (animateSignal <= 0) return; // only run when explicitly triggered via Play
    const run = async () => {
      if (runningRef.current) return; // prevent overlap
      runningRef.current = true;
      onAnimationStart?.();

      // Phase: idle (render initial)
      setPhase('idle');
      setLetters(sourceLetters);

      const delay = (ms: number) => new Promise((r) => setTimeout(r, prefersReduced ? Math.min(ms, 50) : ms * SPEED_MULTIPLIER));

      // Phase: deleting
      setPhase('deleting');
      // mark to-be-deleted ids and keep them visible in red for the whole deletion duration
      deletingIdsRef.current = new Set(plan.deletions.map((i) => `src-${i}`));
      // ensure frame renders with red before timing
      await new Promise(requestAnimationFrame);
      // hold this state for the full deletion duration so red is noticeable
      await delay(DURATIONS.deleting);
      // now remove the deletions to trigger exit animations
      const afterDelete = sourceLetters.filter((_, i) => !plan.deletions.includes(i));
      setLetters(afterDelete);
      // brief pause to allow exit animations to complete before moving phase
      await delay(150);

      // Phase: moving (reorder survivors into target order)
      setPhase('moving');
      setLetters(movingLetters);
      await delay(DURATIONS.moving);

      // Phase: inserting (render final target, AnimatePresence will handle enters)
      setPhase('inserting');
      // Preserve survivors by reusing their original ids; only create ids for new insertions
      const finalLetters: LetterItem[] = [];
      for (let j = 0; j < target.length; j++) {
        const ch = target[j];
        const srcIdx = targetToSourceMap.get(j);
        if (srcIdx !== undefined) {
          finalLetters.push({ id: `src-${srcIdx}`, char: ch });
        } else {
          finalLetters.push({ id: `ins-${j}`, char: ch });
        }
      }
      setLetters(finalLetters);
      await delay(DURATIONS.inserting);

      // Phase: final
      setPhase('final');
      runningRef.current = false;
      onAnimationComplete?.();
    };

    run();
    return () => { runningRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateSignal]);

  // Handle external reset without animating
  useEffect(() => {
    if (resetSignal === undefined) return;
    // Bring the view back to the initial state instantly
    runningRef.current = false;
    setPhase('idle');
    setLetters(sourceLetters);
    // do not call onAnimationStart/Complete
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal, sourceLetters]);

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
      <div className="flex flex-wrap items-center gap-1 text-[--color-text-secondary] mb-3">
        <span className="text-sm">Phase:</span>
        <span className="text-sm font-mono">{phase}</span>
      </div>
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
