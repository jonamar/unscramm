import { useEffect, useRef, useState } from 'react';
import { ClipboardPaste, CornerDownLeft, Play, RotateCcw, Check, ChevronDown, Rabbit, Turtle, Snail } from 'lucide-react';
import DiffVisualizer from './components/DiffVisualizer';
import logoUrl from './assets/unscramm-icon.png';
import { spellService, type Suggestion } from './services/spell-suggestions';
import { CircleButton, InputField, RectButton } from './components/DesignSystem';

type Stage = 'intro' | 'suggestions' | 'animation';
type AnimationSpeed = 'snail' | 'turtle' | 'rabbit';

const SPEED_CONFIG = {
  snail: { multiplier: 4, icon: Snail, label: 'Snail' },      // 4x slower (0.25x speed)
  turtle: { multiplier: 2, icon: Turtle, label: 'Turtle' },   // 2x slower (0.5x speed)
  rabbit: { multiplier: 1, icon: Rabbit, label: 'Rabbit' },   // 1x normal speed
};

function App() {
  const [stage, setStage] = useState<Stage>('intro');
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [animateSignal, setAnimateSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [running, setRunning] = useState(false);
  const [hasCompletedRun, setHasCompletedRun] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [underlineActive, setUnderlineActive] = useState(false);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);
  const [copyDots, setCopyDots] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>('turtle');
  const [speedLoaded, setSpeedLoaded] = useState(false);
  const [speedDropdownOpen, setSpeedDropdownOpen] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const dotIntervalRef = useRef<number | null>(null);
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

  // Load animation speed preference from storage
  useEffect(() => {
    const loadSpeed = async () => {
      try {
        const result = await chrome.storage.local.get({ animationSpeed: 'turtle' });
        setAnimationSpeed(result.animationSpeed as AnimationSpeed);
        setSpeedLoaded(true);
      } catch (error) {
        console.error('Failed to load speed preference:', error);
        setSpeedLoaded(true);
      }
    };
    loadSpeed();
  }, []);

  // Save animation speed preference to storage whenever it changes
  useEffect(() => {
    if (!speedLoaded) return; // Don't save until we've loaded the initial value
    
    const saveSpeed = async () => {
      try {
        await chrome.storage.local.set({ animationSpeed });
      } catch (error) {
        console.error('Failed to save speed preference:', error);
      }
    };
    saveSpeed();
  }, [animationSpeed, speedLoaded]);

  const triggerAnimation = () => {
    setRunning(true);
    setHasCompletedRun(false);
    runTokenRef.current += 1;
    setAnimateSignal((n) => n + 1);
    setUnderlineActive(true);
    setStage('animation');
  };

  const onComplete = () => {
    setRunning(false);
    setUnderlineActive(false);
    setHasCompletedRun(true);
  };

  const onReset = () => {
    // Reset the view to the initial state without starting animation (even if running)
    setRunning(false); // unlock Play immediately in a single source of truth
    setResetSignal((n) => n + 1);
    setHasCompletedRun(false);
  };

  const onPrimaryAction = () => {
    if (running || !target) return;
    if (hasCompletedRun) {
      onReset();
      return;
    }
    triggerAnimation();
  };

  const extractWord = (text: string) => text.trim().split(/\s+/)[0]?.toLowerCase() ?? '';

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
    setSource(firstWord.toLowerCase());
    setTarget('');
    setSuggestions([]);
    setRunning(false);
    setStage('suggestions');
    setUnderlineActive(true);
    // Reset animation signals so the next animation starts fresh
    setAnimateSignal(0);
    setResetSignal(0);
    setHasCompletedRun(false);
    setCopiedWord(null);
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

  const onSubmitInput = async () => {
    if (!inputValue) return;
    await goToSuggestions(inputValue);
    setInputValue('');
  };

  const clearCopyIndicator = () => {
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }
    if (dotIntervalRef.current) {
      window.clearInterval(dotIntervalRef.current);
      dotIntervalRef.current = null;
    }
    setCopiedWord(null);
    setCopyDots(0);
  };

  const clearTransitionTimer = () => {
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  };


  const scheduleAnimationTransition = (word: string) => {
    clearTransitionTimer();
    
    // Start dot animation
    setCopyDots(0);
    dotIntervalRef.current = window.setInterval(() => {
      setCopyDots(prev => {
        if (prev >= 3) {
          if (dotIntervalRef.current) {
            window.clearInterval(dotIntervalRef.current);
            dotIntervalRef.current = null;
          }
          return prev;
        }
        return prev + 1;
      });
    }, 250); // Update every 250ms for 1 second total
    
    transitionTimeoutRef.current = window.setTimeout(() => {
      setTarget(word);
      setStage('animation');
      setUnderlineActive(true);
      setHasCompletedRun(false);
      clearCopyIndicator();
      transitionTimeoutRef.current = null;
    }, 1000);
  };

  const onSuggestionClick = async (word: string) => {
    if (running) return;
    setClipboardError(null);
    const normalizedWord = word.toLowerCase();
    try {
      await navigator.clipboard.writeText(normalizedWord);
      setCopiedWord(normalizedWord);
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => setCopiedWord(null), 2000);
      scheduleAnimationTransition(normalizedWord);
    } catch (error) {
      setClipboardError('Unable to copy to clipboard');
    }
  };

  useEffect(() => {
    return () => {
      clearCopyIndicator();
      clearTransitionTimer();
    };
  }, []);

  // Close speed dropdown when clicking outside
  useEffect(() => {
    if (!speedDropdownOpen) return;
    
    const handleClickOutside = () => setSpeedDropdownOpen(false);
    document.addEventListener('click', handleClickOutside);
    
    return () => document.removeEventListener('click', handleClickOutside);
  }, [speedDropdownOpen]);

  const renderFooterBar = () => (
    <>
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
      <div className="footer-credit">
        Made with care by{' '}
        <a href="https://scrappykin.com" target="_blank" rel="noopener noreferrer">
          Scrappy Kin
        </a>
      </div>
    </>
  );

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
      <div className="footer-credit absolute-bottom">
        Made with care by{' '}
        <a href="https://scrappykin.com" target="_blank" rel="noopener noreferrer">
          Scrappy Kin
        </a>
      </div>
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
            <div className="suggestion-row" key={suggestion.word}>
              <RectButton
                className="justify-start"
                onClick={() => onSuggestionClick(suggestion.word)}
                disabled={running}
              >
                {suggestion.word}
              </RectButton>
              {copiedWord === suggestion.word && (
                <span className="copy-hint-success">
                  <Check size={12} strokeWidth={2} /> Copied{'.'.repeat(copyDots)}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-light">Already spelled correctly</div>
      )}
      {renderFooterBar()}
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
      <div className="transformation-summary text-light">
        {source} → {target}
      </div>
      <div className="animation-display">
        <div className={underlineActive ? 'spell-underline' : undefined}>
          <DiffVisualizer
            source={source}
            target={target}
            animateSignal={animateSignal}
            resetSignal={resetSignal}
            onAnimationStart={() => {}}
            onAnimationComplete={onComplete}
            speedMultiplier={2.5 * SPEED_CONFIG[animationSpeed].multiplier}
          />
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        <CircleButton onClick={onPrimaryAction} disabled={running || !target}>
          {hasCompletedRun && !running ? (
            <RotateCcw size={14} strokeWidth={1.5} />
          ) : (
            <Play
              size={14}
              strokeWidth={1.5}
              className={running || !target ? 'text-gray-500' : undefined}
            />
          )}
        </CircleButton>
        <div className="speed-selector">
          <button
            className="ds-rect-button speed-button"
            onClick={(e) => {
              e.stopPropagation();
              setSpeedDropdownOpen(!speedDropdownOpen);
            }}
            disabled={running}
          >
            {(() => {
              const SpeedIcon = SPEED_CONFIG[animationSpeed].icon;
              return <SpeedIcon size={14} strokeWidth={1.5} />;
            })()}
            <ChevronDown size={14} strokeWidth={1.5} />
          </button>
          {speedDropdownOpen && (
            <div className="speed-dropdown">
              {(Object.keys(SPEED_CONFIG) as AnimationSpeed[]).map((speed) => {
                const config = SPEED_CONFIG[speed];
                const SpeedIcon = config.icon;
                return (
                  <button
                    key={speed}
                    className="speed-option"
                    onClick={() => {
                      setAnimationSpeed(speed);
                      setSpeedDropdownOpen(false);
                    }}
                  >
                    <SpeedIcon size={14} strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {renderFooterBar()}
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
