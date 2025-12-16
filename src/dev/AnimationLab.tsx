import { useState, useMemo, useCallback, useRef } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import DiffVisualizer from '../components/DiffVisualizer';
import { CircleButton } from '../components/DesignSystem';
import { SpeedSelector, getSpeedMultiplier, type AnimationSpeed } from '../components/SpeedSelector';
import { computeEditPlan } from '../utils/editPlan';
import { TIMING, DEFAULT_SPEED_MULTIPLIER } from '../utils/animationTiming';
import { TimingPanel, type TimingOverrides } from './TimingPanel';
import '../index.css';
import './AnimationLab.css';

const DEFAULT_TIMING: TimingOverrides = { ...TIMING };

interface TestCase {
  source: string;
  target: string;
  note: string;
}

type Category = 'move' | 'delete' | 'insert' | 'complex';

interface CategoryConfig {
  label: string;
  color: string;
  cases: TestCase[];
}

const TEST_CATEGORIES: Record<Category, CategoryConfig> = {
  move: {
    label: 'Move',
    color: '#eab308',
    cases: [
      { source: 'recieve', target: 'receive', note: 'adjacent swap (i↔e)' },
      { source: 'wodr', target: 'word', note: 'simple swap' },
      { source: 'owdr', target: 'word', note: 'multiple moves' },
      { source: 'teh', target: 'the', note: 'classic typo' },
      { source: 'freind', target: 'friend', note: 'ie swap' },
    ],
  },
  delete: {
    label: 'Delete',
    color: '#ef4444',
    cases: [
      { source: 'apple', target: 'aple', note: 'simple deletion' },
      { source: 'doog', target: 'dog', note: 'contraction' },
    ],
  },
  insert: {
    label: 'Insert',
    color: '#22c55e',
    cases: [
      { source: 'aple', target: 'apple', note: 'simple insertion' },
    ],
  },
  complex: {
    label: 'Complex',
    color: '#a78bfa',
    cases: [
      { source: 'repetative', target: 'repetitive', note: 'far move + replacement' },
      { source: 'laber', target: 'labor', note: 'replacement (e→o)' },
      { source: 'odessy', target: 'odyssey', note: 'complex reorder' },
      { source: 'seperate', target: 'separate', note: 'vowel replacement' },
    ],
  },
};

// Flat list for index lookup
const TEST_CASES = Object.values(TEST_CATEGORIES).flatMap(cat => cat.cases);

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall back
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function formatPlanShorthand(source: string, target: string) {
  const plan = computeEditPlan(source, target);
  const lines: string[] = [];

  // Deletions
  if (plan.deletions.length > 0) {
    const dels = plan.deletions.map(i => `pos[${i}] "${source[i]}"`).join(', ');
    lines.push(`delete: ${dels}`);
  } else {
    lines.push('delete: none');
  }

  // Moves
  if (plan.moves.length > 0) {
    const moves = plan.moves.map(m => `pos[${m.fromIndex}→${m.toIndex}] "${source[m.fromIndex]}"`).join(', ');
    lines.push(`move: ${moves}`);
  } else {
    lines.push('move: none');
  }

  // Insertions
  if (plan.insertions.length > 0) {
    const ins = plan.insertions.map(i => `pos[${i.position}] "${i.letter}"`).join(', ');
    lines.push(`insert: ${ins}`);
  } else {
    lines.push('insert: none');
  }

  // Replacements
  if (plan.replacements.length > 0) {
    const repls = plan.replacements.map(r => `pos[${r.sourceIndex}] "${r.deletedChar}"→"${r.insertedChar}"`).join(', ');
    lines.push(`replace: ${repls}`);
  } else {
    lines.push('replace: none');
  }

  // Highlights
  if (plan.highlightIndices.length > 0) {
    lines.push(`highlight: [${plan.highlightIndices.join(',')}] (distance ≤1)`);
  } else {
    lines.push('highlight: none');
  }

  return lines.join('\n');
}

function formatTimingConfig(t: TimingOverrides) {
  return `// Paste into src/utils/animationTiming.ts
export const TIMING = {
  deletePerOp: ${t.deletePerOp},
  deleteMin: ${t.deleteMin},
  deleteBuffer: ${t.deleteBuffer},
  movePerOp: ${t.movePerOp},
  moveMin: ${t.moveMin},
  moveBuffer: ${t.moveBuffer},
  insertPerOp: ${t.insertPerOp},
  insertMin: ${t.insertMin},
  insertBuffer: ${t.insertBuffer},
  motionPerLetter: ${t.motionPerLetter},
  deletionExitDelay: ${t.deletionExitDelay},
};`;
}

export default function AnimationLab() {
  // Read source/target from URL params if present
  const urlParams = new URLSearchParams(window.location.search);
  const initialSource = urlParams.get('source') || '';
  const initialTarget = urlParams.get('target') || '';

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customSource, setCustomSource] = useState(initialSource);
  const [customTarget, setCustomTarget] = useState(initialTarget);
  const [animateSignal, setAnimateSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [animationLog, setAnimationLog] = useState<string[]>([]);
  const [phase, setPhase] = useState<string>('idle');
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>('turtle');
  const [copied, setCopied] = useState<'config' | 'shorthand' | null>(null);
  const [running, setRunning] = useState(false);
  const [hasCompletedRun, setHasCompletedRun] = useState(false);
  const [timing, setTiming] = useState<TimingOverrides>(DEFAULT_TIMING);

  const handleTimingChange = useCallback((key: keyof TimingOverrides, value: number) => {
    setTiming(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleTimingReset = useCallback(() => {
    setTiming(DEFAULT_TIMING);
  }, []);

  const useCustom = customSource.trim() !== '' && customTarget.trim() !== '';
  const source = useCustom ? customSource : TEST_CASES[selectedIndex].source;
  const target = useCustom ? customTarget : TEST_CASES[selectedIndex].target;

  const plan = useMemo(() => computeEditPlan(source, target), [source, target]);

  // Compute durations using current timing overrides
  const durations = useMemo(() => {
    const deleteCount = plan.deletions.length;
    const moveCount = plan.moves.length;
    const insertCount = plan.insertions.length;

    return {
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
  }, [plan, timing]);

  const handlePlay = () => {
    setAnimationLog([`[0ms] Starting: "${source}" → "${target}"`]);
    setRunning(true);
    setAnimateSignal(n => n + 1);
  };

  const handleReset = () => {
    setResetSignal(n => n + 1);
    setAnimationLog([]);
    setPhase('idle');
    setRunning(false);
    setHasCompletedRun(false);
  };

  const handlePrimaryAction = () => {
    if (hasCompletedRun && !running) {
      handleReset();
    } else {
      handlePlay();
    }
  };

  const phaseRef = useRef(phase);
  const handlePhaseChange = useCallback((newPhase: string) => {
    if (phaseRef.current === newPhase) return; // prevent duplicate updates
    phaseRef.current = newPhase;
    setPhase(newPhase);
    setAnimationLog(prev => [...prev, `Phase: ${newPhase}`]);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setAnimationLog(prev => [...prev, `[done] Animation complete`]);
    setRunning(false);
    setHasCompletedRun(true);
  }, []);

  const handleCopyConfig = useCallback(async () => {
    const ok = await copyTextToClipboard(formatTimingConfig(timing));
    if (!ok) return;
    setCopied('config');
    window.setTimeout(() => setCopied(null), 900);
  }, [timing]);

  const handleCopyShorthand = useCallback(async () => {
    const header = `${source} → ${target}`;
    const shorthand = formatPlanShorthand(source, target);
    const ok = await copyTextToClipboard(`${header}\n${shorthand}`);
    if (!ok) return;
    setCopied('shorthand');
    window.setTimeout(() => setCopied(null), 900);
  }, [source, target]);


  return (
    <div className="lab-container">
      {/* Left Column - Visualizer */}
      <div className="lab-left">
        <div className="lab-controls">
          <button
            className="lab-nav-btn"
            onClick={() => {
              const newIndex = selectedIndex > 0 ? selectedIndex - 1 : TEST_CASES.length - 1;
              setSelectedIndex(newIndex);
              setCustomSource('');
              setCustomTarget('');
              handleReset();
            }}
            title="Previous example"
          >
            ‹
          </button>
          <select
            value={selectedIndex}
            onChange={e => {
              setSelectedIndex(Number(e.target.value));
              setCustomSource('');
              setCustomTarget('');
              handleReset();
            }}
            className="lab-select"
          >
            {(() => {
              let globalIndex = 0;
              return (Object.entries(TEST_CATEGORIES) as [Category, CategoryConfig][]).map(([key, cat]) => (
                <optgroup key={key} label={cat.label} className={`lab-optgroup--${key}`}>
                  {cat.cases.map((tc) => {
                    const idx = globalIndex++;
                    return (
                      <option key={idx} value={idx} style={{ color: cat.color }}>
                        {tc.source} → {tc.target} ({tc.note})
                      </option>
                    );
                  })}
                </optgroup>
              ));
            })()}
          </select>
          <button
            className="lab-nav-btn"
            onClick={() => {
              const newIndex = selectedIndex < TEST_CASES.length - 1 ? selectedIndex + 1 : 0;
              setSelectedIndex(newIndex);
              setCustomSource('');
              setCustomTarget('');
              handleReset();
            }}
            title="Next example"
          >
            ›
          </button>
        </div>

        {/* Letter operation table - flipped: chars as columns, type/from/to as rows */}
        {(() => {
          // Build unified character list from all operations (computed once, used for all rows)
          const tableData: Array<{
            char: string;
            type: string;
            from: number | null;
            to: number | null;
            color: string;
          }> = [];

          // Survivors (keep/move)
          plan.survivorPairs.forEach(pair => {
            const type = pair.sourceIndex === pair.targetIndex ? 'keep' : 'move';
            tableData.push({
              char: pair.char,
              type,
              from: pair.sourceIndex + 1,
              to: pair.targetIndex + 1,
              color: type === 'move' ? '#eab308' : '#888',
            });
          });

          // Replacements
          plan.replacements.forEach(r => {
            tableData.push({
              char: `${r.deletedChar}→${r.insertedChar}`,
              type: 'repl',
              from: r.sourceIndex + 1,
              to: r.targetIndex + 1,
              color: '#a78bfa',
            });
          });

          // Deletions (not part of replacements)
          plan.deletions
            .filter(idx => !plan.replacements.some(r => r.sourceIndex === idx))
            .forEach(idx => {
              tableData.push({
                char: source[idx],
                type: 'del',
                from: idx + 1,
                to: null,
                color: '#ef4444',
              });
            });

          // Insertions (not part of replacements) - placed at end since no source position
          plan.insertions
            .filter(ins => !plan.replacements.some(r => r.targetIndex === ins.position))
            .forEach(ins => {
              tableData.push({
                char: ins.letter,
                type: 'ins',
                from: null,
                to: ins.position + 1,
                color: '#22c55e',
              });
            });

          // Sort by source position (from index), insertions go to end
          tableData.sort((a, b) => {
            const posA = a.from ?? 999;
            const posB = b.from ?? 999;
            return posA - posB;
          });

          return (
            <div className="lab-letter-table-container">
              <table className="lab-letter-table lab-letter-table--horizontal">
                <tbody>
                  <tr className="lab-table-row-chars">
                    <th></th>
                    {tableData.map((c, i) => (
                      <th key={i} style={{ color: c.color }}>{c.char}</th>
                    ))}
                  </tr>
                  <tr>
                    <th>type</th>
                    {tableData.map((c, i) => (
                      <td key={i} style={{ color: c.color }}>{c.type}</td>
                    ))}
                  </tr>
                  <tr>
                    <th>from</th>
                    {tableData.map((c, i) => (
                      <td key={i} style={{ color: c.color }}>{c.from ?? '+'}</td>
                    ))}
                  </tr>
                  <tr>
                    <th>to</th>
                    {tableData.map((c, i) => (
                      <td key={i} style={{ color: c.color }}>{c.to ?? '✕'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })()}

        <div className="lab-visualizer-container">
          <div className="lab-visualizer">
            <DiffVisualizer
              source={source}
              target={target}
              animateSignal={animateSignal}
              resetSignal={resetSignal}
              onPhaseChange={handlePhaseChange}
              onAnimationComplete={handleAnimationComplete}
              speedMultiplier={DEFAULT_SPEED_MULTIPLIER * getSpeedMultiplier(animationSpeed)}
              timingOverrides={timing}
            />
          </div>
          <div className="animation-controls">
            <CircleButton
              className="play-button-large"
              onClick={handlePrimaryAction}
              disabled={running || !target}
            >
              {hasCompletedRun && !running ? (
                <RotateCcw size={28} strokeWidth={1.5} className="icon-reset" />
              ) : (
                <Play
                  size={28}
                  strokeWidth={1.5}
                  className={running || !target ? 'text-gray-500' : undefined}
                />
              )}
            </CircleButton>
            <SpeedSelector
              value={animationSpeed}
              onChange={setAnimationSpeed}
              disabled={running}
            />
          </div>
        </div>

        <div className="lab-phase-indicator">
          Phase: <strong>{phase}</strong>
        </div>
      </div>

      {/* Right Column - Info & Controls */}
      <div className="lab-right">
        <section className="lab-section">
          <TimingPanel
            values={timing}
            onChange={handleTimingChange}
            onReset={handleTimingReset}
          />
          <div className="timing-export">
            <button onClick={handleCopyConfig} className="lab-copy-btn">
              {copied === 'config' ? 'Copied!' : 'Copy Config'}
            </button>
          </div>
        </section>

        <section className="lab-section">
          <h3>
            Plan Shorthand
            <button onClick={handleCopyShorthand} className="lab-copy-btn">
              {copied === 'shorthand' ? 'Copied' : 'Copy'}
            </button>
          </h3>
          <pre className="lab-pre">{source} → {target}
{formatPlanShorthand(source, target)}</pre>
        </section>

        <section className="lab-section">
          <h3>Animation Log</h3>
          <div className="lab-log">
            {animationLog.length === 0 ? (
              <div className="lab-log-empty">Press Play to start</div>
            ) : (
              animationLog.map((line, i) => <div key={i}>{line}</div>)
            )}
          </div>
        </section>

        <section className="lab-section">
          <h3>Computed Durations</h3>
          <div className="lab-durations">
            <div>deleting: <strong>{durations.deleting}ms</strong> ({plan.deletions.length} ops)</div>
            <div>moving: <strong>{durations.moving}ms</strong> ({plan.moves.length} ops)</div>
            <div>inserting: <strong>{durations.inserting}ms</strong> ({plan.insertions.length} ops)</div>
          </div>
        </section>
      </div>
    </div>
  );
}
