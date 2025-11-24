import { useEffect, useRef, useState } from 'react';
import { ClipboardPaste, CornerDownLeft, Play, RotateCcw } from 'lucide-react';
import DiffVisualizer from './components/DiffVisualizer';
import logoUrl from './assets/unscramm-icon.png';
import { spellService, type Suggestion } from './services/spell-suggestions';
import { CircleButton, InputField, RectButton } from './components/DesignSystem';

type Stage = 'intro' | 'suggestions' | 'animation';

function App() {
  const [stage, setStage] = useState<Stage>('intro');
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [animateSignal, setAnimateSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [running, setRunning] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [underlineActive, setUnderlineActive] = useState(false);
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

  const triggerAnimation = () => {
    setRunning(true);
    runTokenRef.current += 1;
    setAnimateSignal((n) => n + 1);
    setUnderlineActive(true);
    setStage('animation');
  };

  const onAnimate = () => {
    if (running || !target) return;
    triggerAnimation();
  };

  const onComplete = () => {
    setRunning(false);
    setUnderlineActive(false);
  };

  const onReset = () => {
    // Reset the view to the initial state without starting animation (even if running)
    setRunning(false); // unlock Play immediately in a single source of truth
    setResetSignal((n) => n + 1);
  };

  const extractWord = (text: string) => text.trim().split(/\s+/)[0] ?? '';

  const fetchSuggestions = async (word: string) => {
    if (!spellService.isReady()) {
      setServiceLoading(true);
      try {
        await spellService.initialize();
        setServiceLoading(false);
      } catch (error) {
        setServiceError('Failed to load dictionary');
        setServiceLoading(false);
        return;
      }
    }

    setSuggestionsLoading(true);
    const results = await spellService.getSuggestions(word);
    setSuggestions(results);
    setSuggestionsLoading(false);
  };

  const goToSuggestions = async (wordInput: string) => {
    setClipboardError(null);
    const firstWord = extractWord(wordInput);
    if (!firstWord) {
      setClipboardError('Enter a word to begin');
      return;
    }
    setSource(firstWord);
    setTarget('');
    setSuggestions([]);
    setRunning(false);
    setStage('suggestions');
    setUnderlineActive(true);
    // Reset animation signals so the next animation starts fresh
    setAnimateSignal(0);
    setResetSignal(0);
    await fetchSuggestions(firstWord);
  };

  const onPasteFromClipboard = async () => {
    setClipboardError(null);
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setClipboardError('Clipboard empty or inaccessible');
        return;
      }
      await goToSuggestions(text);
    } catch (error) {
      setClipboardError('Clipboard empty or inaccessible');
    }
  };

  const onSelectSuggestion = (suggestion: Suggestion) => {
    setTarget(suggestion.word);
    setStage('animation');
    setUnderlineActive(true);
  };

  const onSubmitInput = async () => {
    if (!inputValue) return;
    await goToSuggestions(inputValue);
    setInputValue('');
  };

  const renderIntroStage = () => (
    <div className="stage-intro">
      <img src={logoUrl} alt="Unscramm" className="intro-logo" />
      <div className="heading-large">Give me a word to unscramble</div>
      <RectButton className="intro-button" onClick={onPasteFromClipboard} disabled={serviceLoading}>
        <ClipboardPaste size={14} strokeWidth={1.5} />
        Paste from Clipboard
      </RectButton>
      <InputField
        className="intro-input"
        placeholder="or type here"
        value={inputValue}
        onChange={setInputValue}
        onAction={onSubmitInput}
        actionIcon={<CornerDownLeft size={14} strokeWidth={1.5} />}
        disabled={serviceLoading}
      />
    </div>
  );

  const renderSuggestionsStage = () => (
    <div className="stage-suggestions">
      <img 
        src={logoUrl} 
        alt="Unscramm" 
        className="logo-top-right" 
        onClick={() => setStage('intro')}
      />
      <div className="spell-underline heading-large">{source}</div>
      <div className="text-light">Suggestions:</div>
      {suggestionsLoading ? (
        <div className="text-light">Loading suggestions...</div>
      ) : suggestions.length > 0 ? (
        <div className="suggestion-group">
          {suggestions.map((suggestion) => (
            <RectButton
              key={suggestion.word}
              className="w-full justify-center"
              onClick={() => onSelectSuggestion(suggestion)}
              disabled={running}
            >
              {suggestion.word}
            </RectButton>
          ))}
        </div>
      ) : (
        <div className="text-light">No suggestions found</div>
      )}
    </div>
  );

  const renderAnimationStage = () => (
    <div className="stage-animation">
      <img 
        src={logoUrl} 
        alt="Unscramm" 
        className="logo-top-right" 
        onClick={() => setStage('intro')}
      />
      <div className={underlineActive ? 'spell-underline' : ''}>
        <DiffVisualizer
          source={source}
          target={target}
          animateSignal={animateSignal}
          resetSignal={resetSignal}
          onAnimationStart={() => {}}
          onAnimationComplete={onComplete}
        />
      </div>
      <div className="text-light text-center">
        {source} → {target}
      </div>
      <div className="flex items-center justify-center gap-4">
        <CircleButton onClick={onAnimate} disabled={running}>
          <Play size={14} strokeWidth={1.5} />
        </CircleButton>
        <CircleButton onClick={onReset}>
          <RotateCcw size={14} strokeWidth={1.5} />
        </CircleButton>
      </div>
      <div className="footer-bar">
        <RectButton onClick={onPasteFromClipboard}>
          <ClipboardPaste size={14} strokeWidth={1.5} />
        </RectButton>
        <InputField
          value={inputValue}
          onChange={setInputValue}
          onAction={onSubmitInput}
          actionIcon={<CornerDownLeft size={14} strokeWidth={1.5} />}
          actionDisabled={serviceLoading}
        />
      </div>
    </div>
  );

  return (
    <main className="app-shell">
      {stage === 'intro' && renderIntroStage()}
      {stage === 'suggestions' && renderSuggestionsStage()}
      {stage === 'animation' && renderAnimationStage()}
      {serviceError && <div className="error-text">{serviceError}</div>}
      {clipboardError && <div className="error-text">{clipboardError}</div>}
    </main>
  );
}

export default App;
