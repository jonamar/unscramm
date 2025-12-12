import { useEffect, useRef, useState } from 'react';
import { ClipboardPaste, CornerDownLeft } from 'lucide-react';
import { spellService, type Suggestion } from './services/spell-suggestions';
import { InputField, RectButton } from './components/DesignSystem';
import { IntroStage } from './components/IntroStage';
import { SuggestionsStage } from './components/SuggestionsStage';
import { AnimationStage } from './components/AnimationStage';
import { useAnimationSpeed } from './hooks/useAnimationSpeed';
import type { Platform } from './platform/types';

type Stage = 'intro' | 'suggestions' | 'animation';

interface AppProps {
  platform: Platform;
}

function App({ platform }: AppProps) {
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
  const [animationSpeed, setAnimationSpeed] = useAnimationSpeed(platform);
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
      const text = await platform.clipboard.readText();
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
      await platform.clipboard.writeText(normalizedWord);
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


  const footerBar = (
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

  return (
    <main className="app-shell">
      {stage === 'intro' && (
        <IntroStage
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSubmit={onSubmitInput}
          onPasteFromClipboard={onPasteFromClipboard}
          disabled={serviceLoading}
        />
      )}
      {stage === 'suggestions' && (
        <SuggestionsStage
          source={source}
          suggestions={suggestions}
          suggestionsLoading={suggestionsLoading}
          copiedWord={copiedWord}
          copyDots={copyDots}
          running={running}
          onLogoClick={() => setStage('intro')}
          onSuggestionClick={onSuggestionClick}
          footerBar={footerBar}
        />
      )}
      {stage === 'animation' && (
        <AnimationStage
          source={source}
          target={target}
          animateSignal={animateSignal}
          resetSignal={resetSignal}
          running={running}
          hasCompletedRun={hasCompletedRun}
          underlineActive={underlineActive}
          animationSpeed={animationSpeed}
          onLogoClick={() => setStage('intro')}
          onPrimaryAction={onPrimaryAction}
          onAnimationComplete={onComplete}
          onSpeedChange={setAnimationSpeed}
          footerBar={footerBar}
        />
      )}
      {serviceError && <div className="error-text">{serviceError}</div>}
      {clipboardError && <div className="error-text">{clipboardError}</div>}
    </main>
  );
}

export default App;
