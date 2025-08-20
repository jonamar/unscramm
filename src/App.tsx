import { useRef, useState } from 'react';
import type { Phase } from './components/WordUnscrambler';
import WordUnscrambler from './components/WordUnscrambler';
import './App.css';

function App() {
  const [source, setSource] = useState('tesd');
  const [target, setTarget] = useState('tads');
  const [animateSignal, setAnimateSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const runTokenRef = useRef(0);

  const onAnimate = () => {
    if (running) return;
    setRunning(true);
    runTokenRef.current += 1;
    setAnimateSignal((n) => n + 1);
  };

  const onComplete = () => {
    setRunning(false);
  };

  const onReset = () => {
    if (running) return;
    // Reset the view to the initial state without starting animation
    setResetSignal((n) => n + 1);
  };

  return (
    <main className="main w-full max-w-[600px] mx-auto px-6 box-border">
      <h1 className="heading">Unscramm v3</h1>

      <section className="mt-6 flex justify-center">
        <WordUnscrambler
          source={source}
          target={target}
          animateSignal={animateSignal}
          resetSignal={resetSignal}
          onAnimationStart={() => {}}
          onAnimationComplete={onComplete}
          onPhaseChange={setPhase}
        />
      </section>

      <div className="panel input-panel flex items-center gap-2 w-full max-w-[600px] mt-6">
        <input
          type="text"
          className="input flex-1"
          placeholder="Enter misspelling"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={running}
        />
        <span className="shrink-0 text-white/70 text-xl">→</span>
        <input
          type="text"
          className="input flex-1"
          placeholder="Enter correct word"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          disabled={running}
        />
        <button className="btn neu" onClick={onAnimate} disabled={running || !source || !target} aria-label="Animate">
          ▶
        </button>
        <button className="btn neu" onClick={onReset} disabled={running} aria-label="Reset view">
          ↺
        </button>
      </div>

      {/* Centered, more subdued phase indicator under the controls */}
      <div className="w-full flex justify-center mt-2 text-[--color-text-secondary] opacity-60">
        <div className="flex items-center gap-1">
          <span className="text-sm">Phase:</span>
          <span className="text-sm font-mono">{phase}</span>
        </div>
      </div>
    </main>
  );
}

export default App;
