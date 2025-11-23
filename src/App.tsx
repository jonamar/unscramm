import { useEffect, useRef, useState } from 'react';
import type { Phase } from './components/DiffVisualizer';
import DiffVisualizer from './components/DiffVisualizer';
import logoUrl from './assets/unscramm-logo.svg';
import { spellService, type Suggestion } from './services/spell-suggestions';

function App() {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [animateSignal, setAnimateSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const runTokenRef = useRef(0);

  // Initialize spell service on mount
  useEffect(() => {
    const init = async () => {
      try {
        await spellService.initialize();
        setServiceLoading(false);
      } catch (error) {
        setServiceError('Failed to load dictionary');
        setServiceLoading(false);
      }
    };
    init();
  }, []);

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
    // Reset the view to the initial state without starting animation (even if running)
    setRunning(false); // unlock Play immediately in a single source of truth
    setResetSignal((n) => n + 1);
  };

  const onPasteFromClipboard = async () => {
    setClipboardError(null);
    try {
      const text = await navigator.clipboard.readText();
      const firstWord = text.trim().split(/\s+/)[0];

      if (!firstWord) {
        setClipboardError('Paste a word to begin');
        return;
      }

      setSource(firstWord);
      setTarget('');
      setSuggestions([]);

      // Get suggestions
      if (spellService.isReady()) {
        setSuggestionsLoading(true);
        const results = await spellService.getSuggestions(firstWord);
        setSuggestions(results);
        setSuggestionsLoading(false);
      }
    } catch (error) {
      setClipboardError('Clipboard empty or inaccessible');
    }
  };

  const onCopyToClipboard = async () => {
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target);
    } catch (error) {
      console.error('Failed to copy to clipboard', error);
    }
  };

  const onSelectSuggestion = (suggestion: Suggestion) => {
    setTarget(suggestion.word);
    // Auto-play animation
    if (!running) {
      setRunning(true);
      runTokenRef.current += 1;
      setAnimateSignal((n) => n + 1);
    }
  };

  // Get suggestions when source changes manually
  useEffect(() => {
    if (!source || !spellService.isReady()) {
      setSuggestions([]);
      return;
    }

    const getSuggestions = async () => {
      setSuggestionsLoading(true);
      const results = await spellService.getSuggestions(source);
      setSuggestions(results);
      setSuggestionsLoading(false);
    };

    const timeoutId = setTimeout(getSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [source]);

  return (
    <main className="main w-full max-w-[360px] mx-auto px-4 box-border pb-6">
      <h1 className="heading flex justify-center">
        <img src={logoUrl} alt="Unscramm" className="h-20" />
      </h1>

      <section className="mt-6 flex justify-center">
        <DiffVisualizer
          source={source}
          target={target}
          animateSignal={animateSignal}
          resetSignal={resetSignal}
          onAnimationStart={() => {}}
          onAnimationComplete={onComplete}
          onPhaseChange={setPhase}
        />
      </section>

      {/* Input controls */}
      <div className="w-full max-w-[360px] mt-6 space-y-3">
        {/* Source field with paste button */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Enter misspelling"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            disabled={running || serviceLoading}
          />
          <button
            className="btn neu text-sm px-3"
            onClick={onPasteFromClipboard}
            disabled={running || serviceLoading}
            aria-label="Paste from clipboard"
            title="Paste from clipboard"
          >
            📋
          </button>
        </div>

        {/* Target field with copy button */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Select suggestion or enter word"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={running}
          />
          <button
            className="btn neu text-sm px-3"
            onClick={onCopyToClipboard}
            disabled={!target}
            aria-label="Copy to clipboard"
            title="Copy corrected spelling"
          >
            📄
          </button>
        </div>

        {/* Play and reset buttons */}
        <div className="flex items-center gap-2 justify-end">
          <button className="btn neu" onClick={onAnimate} disabled={running || !source || !target} aria-label="Animate">
            ▶
          </button>
          <button className="btn neu" onClick={onReset} aria-label="Reset view">
            ↺
          </button>
        </div>
      </div>

      {/* Status messages */}
      {serviceLoading && (
        <div className="w-full flex justify-center mt-4 text-[--color-text-secondary] text-sm">
          Loading suggestions...
        </div>
      )}

      {serviceError && (
        <div className="w-full flex justify-center mt-4 text-[--color-deletion] text-sm">
          {serviceError}
        </div>
      )}

      {clipboardError && (
        <div className="w-full flex justify-center mt-4 text-[--color-deletion] text-sm">
          {clipboardError}
        </div>
      )}

      {/* Suggestions list */}
      {source && !serviceLoading && !serviceError && (
        <div className="w-full max-w-[360px] mt-4">
          {suggestionsLoading ? (
            <div className="text-[--color-text-secondary] text-sm text-center">
              Loading suggestions...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[--color-text-secondary] text-sm">
                Suggestions for '{source}':
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={suggestion.word}
                    className={`btn neu text-sm px-3 py-2 ${idx === 0 ? 'bg-[--color-button-hover]' : ''}`}
                    onClick={() => onSelectSuggestion(suggestion)}
                    disabled={running}
                    aria-label={`Select suggestion: ${suggestion.word}`}
                  >
                    {suggestion.word}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-[--color-text-secondary] text-sm text-center">
              No suggestions found
            </div>
          )}
        </div>
      )}

      {/* Phase indicator */}
      <div className="w-full flex justify-center mt-4 text-[--color-text-secondary] opacity-60">
        <div className="flex items-center gap-1">
          <span className="text-sm">Phase:</span>
          <span className="text-sm font-mono">{phase}</span>
        </div>
      </div>
    </main>
  );
}

export default App;
