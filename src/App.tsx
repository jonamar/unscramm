import { useRef, useState } from 'react';
import WordUnscrambler from './components/WordUnscrambler';
import './App.css';

function App() {
  const [source, setSource] = useState('tesd');
  const [target, setTarget] = useState('tads');
  const [animateSignal, setAnimateSignal] = useState(0);
  const [running, setRunning] = useState(false);
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
    setSource('');
    setTarget('');
  };

  return (
    <main className="main w-full max-w-[600px] mx-auto px-6 box-border">
      <h1 className="mt-10 mb-4 text-white text-2xl font-bold">Unscramm v3</h1>

      <div className="input-panel flex items-center gap-2 w-full max-w-[600px] mt-4">
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded bg-[--color-panel] text-white border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.6),-4px_-4px_8px_rgba(255,255,255,0.05),4px_4px_12px_rgba(0,0,0,0.8)]"
          placeholder="Enter misspelling"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={running}
        />
        <span className="shrink-0 text-white/70 text-xl">→</span>
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded bg-[--color-panel] text-white border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.6),-4px_-4px_8px_rgba(255,255,255,0.05),4px_4px_12px_rgba(0,0,0,0.8)]"
          placeholder="Enter correct word"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          disabled={running}
        />
        <button className="btn neu" onClick={onAnimate} disabled={running || !source || !target} aria-label="Animate">
          ▶
        </button>
        <button className="btn neu" onClick={onReset} disabled={running} aria-label="Reset">
          ↺
        </button>
      </div>

      <section className="mt-8">
        <WordUnscrambler
          source={source}
          target={target}
          animateSignal={animateSignal}
          onAnimationStart={() => {}}
          onAnimationComplete={onComplete}
        />
      </section>
    </main>
  );
}

export default App;
