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

  const plan = useMemo(() => computeEditPlan(source, target), [source, target]);

  // Precompute helpers for rendering
  const sourceLetters = useMemo(() => source.split('').map((char, i) => ({ id: `src-${i}`, char })), [source]);
  const targetLetters = useMemo(() => target.split('').map((char, j) => ({ id: `tgt-${j}`, char })), [target]);
  const lcsMovingLetters = useMemo<LetterItem[]>(() => {
    // LCS survivors ordered by final target indices triggers FLIP reordering
    // Derive from plan.moves highlight + non-true movers by pairing LCS via deletions/insertions
    // Simpler approach: take source letters not deleted, and map them to target order using LCS pairs
    // Build survivors from matches via (all pairs are LCS)
    // We don't have matches in plan; recompute via comparing deletions. Construct indices present after deletion
    const survivors: { fromIndex: number }[] = [];
    for (let i = 0; i < source.length; i++) {
      if (!plan.deletions.includes(i)) survivors.push({ fromIndex: i });
    }
    // We need source->target index mapping for LCS members. Recompute by aligning characters greedily.
    // Basic greedy match: walk target, match next same char from survivors left-to-right.
    const used = new Set<number>();
    const mapped: { fromIndex: number; toIndex: number; char: string }[] = [];
    for (let t = 0; t < target.length; t++) {
      const c = target[t];
      // find next survivor occurrence of c not already used
      let found = -1;
      for (const s of survivors) {
        if (!used.has(s.fromIndex) && source[s.fromIndex] === c) {
          found = s.fromIndex; break;
        }
      }
      if (found >= 0) {
        used.add(found);
        mapped.push({ fromIndex: found, toIndex: t, char: c });
      }
    }
    // Now sort mapped by toIndex for target order
    mapped.sort((a, b) => a.toIndex - b.toIndex);
    return mapped.map(m => ({ id: `src-${m.fromIndex}`, char: m.char }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, target, plan.deletions.join(',')]);

  const [letters, setLetters] = useState<LetterItem[]>(sourceLetters);

  // Orchestrate phases when animateSignal changes
  useEffect(() => {
    const run = async () => {
      if (runningRef.current) return; // prevent overlap
      runningRef.current = true;
      onAnimationStart?.();

      // Phase: idle (render initial)
      setPhase('idle');
      setLetters(sourceLetters);

      const delay = (ms: number) => new Promise((r) => setTimeout(r, prefersReduced ? Math.min(ms, 50) : ms));

      // Phase: deleting
      setPhase('deleting');
      // filter out deletions
      const afterDelete = sourceLetters.filter((_, i) => !plan.deletions.includes(i));
      setLetters(afterDelete);
      await delay(DURATIONS.deleting);

      // Phase: moving (reorder survivors into target order)
      setPhase('moving');
      setLetters(lcsMovingLetters);
      await delay(DURATIONS.moving);

      // Phase: inserting (render final target, AnimatePresence will handle enters)
      setPhase('inserting');
      setLetters(targetLetters);
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
    if (phase === 'deleting') return 'text-deletion';
    if (phase === 'inserting') return 'text-insertion';
    if (phase === 'moving') {
      // highlight true movers using plan.moves (fromIndex)
      const idx = parseInt(item.id.split('-')[1] || '-1', 10);
      const isTrueMover = plan.moves.some(m => m.fromIndex === idx) && plan.highlightIndices.includes(idx);
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
      <div className="flex gap-[0.025em] text-white text-[2rem] select-none">
        <AnimatePresence initial={false}>
          {letters.map((l) => (
            <motion.span
              layout
              key={l.id}
              initial={{ opacity: phase === 'inserting' ? 0 : 1, y: phase === 'inserting' ? 10 : 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: phase === 'deleting' ? 0 : 1, scale: phase === 'deleting' ? 0.8 : 1 }}
              transition={{ duration: prefersReduced ? 0.05 : 0.25 }}
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
