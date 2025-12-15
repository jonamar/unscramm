import { useEffect, useRef, useState } from 'react';
import { Check, ClipboardPaste, CornerDownLeft, Settings } from 'lucide-react';
import { spellService, type Suggestion } from './services/spell-suggestions';
import { InputField, RectButton } from './components/DesignSystem';
import { IntroStage } from './components/IntroStage';
import { SuggestionsStage } from './components/SuggestionsStage';
import { AnimationStage } from './components/AnimationStage';
import { PrivacyWarning } from './components/PrivacyWarning';
import { SettingsPage } from './components/SettingsPage';
import { useAnimationSpeed } from './hooks/useAnimationSpeed';
import { useSettings } from './hooks/useSettings';
import type { Platform } from './platform/types';

type Stage = 'intro' | 'suggestions' | 'animation' | 'settings';

interface AppProps {
  platform: Platform;
}

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const JWT_RE = /\b[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/;
const SSN_DASHED_RE = /\b\d{3}-\d{2}-\d{4}\b/;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

function looksLikeUrl(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('://');
}

function charSetCount(text: string): number {
  let sets = 0;
  if (/[a-z]/.test(text)) sets += 1;
  if (/[A-Z]/.test(text)) sets += 1;
  if (/[0-9]/.test(text)) sets += 1;
  if (/[^a-zA-Z0-9\s]/.test(text)) sets += 1;
  return sets;
}

function looksHighEntropyToken(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/\s/.test(trimmed)) return false;
  if (looksLikeUrl(trimmed)) return false;
  if (trimmed.length < 32) return false;
  if (charSetCount(trimmed) < 3) return false;
  const uniqueRatio = new Set(trimmed).size / trimmed.length;
  return uniqueRatio >= 0.35;
}

function luhnCheck(digits: string): boolean {
  let sum = 0;
  let doubleDigit = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (Number.isNaN(n)) return false;
    if (doubleDigit) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

function looksLikeCreditCard(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (!/^[0-9 -]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  return luhnCheck(digits);
}

function looksLikeSSN(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (SSN_DASHED_RE.test(trimmed)) return true;
  if (/^\d{9}$/.test(trimmed)) return true;
  return false;
}

function looksLikeCvv(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return /^\d{3,4}$/.test(trimmed);
}

function shouldSkipAutoIngest(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (countWords(trimmed) > 3) return true;
  if (EMAIL_RE.test(trimmed)) return true;
  if (JWT_RE.test(trimmed)) return true;
  if (looksLikeSSN(trimmed)) return true;
  if (looksLikeCvv(trimmed)) return true;
  if (looksLikeCreditCard(trimmed)) return true;
  if (looksHighEntropyToken(trimmed)) return true;
  return false;
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [blockedClipboardText, setBlockedClipboardText] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useAnimationSpeed(platform);
  const { settings, loaded: settingsLoaded, setAutoPasteEnabled, setHasSeenOnboarding } = useSettings(platform);
  const previousStageRef = useRef<Stage>('intro');
  const toastTimeoutRef = useRef<number | null>(null);
  const postCompleteTimeoutRef = useRef<number | null>(null);
  const runTokenRef = useRef(0);
  const copiedRunTokenRef = useRef(0);
  const hasAttemptedAutoPaste = useRef(false);
  const goToSuggestionsRef = useRef<(text: string) => void>(() => {});

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastMessage(message);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 1400);
  };

  const clearPostCompleteTimer = () => {
    if (!postCompleteTimeoutRef.current) return;
    window.clearTimeout(postCompleteTimeoutRef.current);
    postCompleteTimeoutRef.current = null;
  };

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

  // Determine what to show on app load based on settings
  useEffect(() => {
    if (!settingsLoaded || hasAttemptedAutoPaste.current) return;
    hasAttemptedAutoPaste.current = true;

    // If user hasn't seen onboarding, show it
    if (!settings.hasSeenOnboarding) {
      setShowOnboarding(true);
      return;
    }

    // If autoPaste is disabled, stay on intro (manual paste page)
    if (!settings.autoPasteEnabled) {
      return;
    }

    // AutoPaste is enabled - attempt to auto-paste
    const attemptAutoPaste = async () => {
      try {
        const text = await platform.clipboard.readText();
        if (text && text.trim()) {
          if (shouldSkipAutoIngest(text)) {
            setBlockedClipboardText(text);
            setShowOnboarding(true); // Show privacy notice for sensitive content
            return;
          }
          await goToSuggestions(text);
        }
      } catch (error) {
        // Clipboard access failed, stay on intro screen silently
        console.debug('Auto-paste failed:', error);
      }
    };

    attemptAutoPaste();
  }, [platform, settingsLoaded, settings.hasSeenOnboarding, settings.autoPasteEnabled]);

  const triggerAnimation = () => {
    setRunning(true);
    setHasCompletedRun(false);
    runTokenRef.current += 1;
    clearPostCompleteTimer();
    setAnimateSignal((n) => n + 1);
    setUnderlineActive(true);
    setStage('animation');
  };

  const onComplete = () => {
    setRunning(false);
    setUnderlineActive(false);
    setHasCompletedRun(true);

    const token = runTokenRef.current;
    if (!target || token <= 0 || copiedRunTokenRef.current === token) return;

    clearPostCompleteTimer();
    postCompleteTimeoutRef.current = window.setTimeout(() => {
      postCompleteTimeoutRef.current = null;

      if (!target || token <= 0 || runTokenRef.current !== token || copiedRunTokenRef.current === token) return;
      copiedRunTokenRef.current = token;

      void (async () => {
        try {
          await platform.clipboard.writeText(target);
          showToast('Copied');
        } catch (error) {
          setClipboardError('Unable to copy to clipboard');
        }
      })();
    }, 1000);
  };

  const onReset = () => {
    // Reset the view to the initial state without starting animation (even if running)
    setRunning(false); // unlock Play immediately in a single source of truth
    clearPostCompleteTimer();
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
    setBlockedClipboardText(null);
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
    await fetchSuggestions(firstWord);
  };

  useEffect(() => {
    goToSuggestionsRef.current = (text: string) => {
      void goToSuggestions(text);
    };
  }, [goToSuggestions]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<string>;
      const text = typeof custom.detail === 'string' ? custom.detail : '';
      if (!text || !text.trim()) return;
      if (shouldSkipAutoIngest(text)) {
        setBlockedClipboardText(text);
        setStage('intro');
        return;
      }
      goToSuggestionsRef.current(text);
    };

    window.addEventListener('unscrammClipboard', handler as EventListener);
    return () => window.removeEventListener('unscrammClipboard', handler as EventListener);
  }, []);

  const onPasteFromClipboard = async () => {
    setClipboardError(null);
    try {
      const text = await platform.clipboard.readText();
      if (!text) {
        setClipboardError('Clipboard empty or inaccessible');
        return;
      }
      if (shouldSkipAutoIngest(text)) {
        setBlockedClipboardText(text);
        setStage('intro');
        return;
      }
      await goToSuggestions(text);
    } catch (error) {
      setClipboardError('Clipboard empty or inaccessible');
    }
  };

  const onPrivacyGetStarted = async () => {
    await setHasSeenOnboarding(true);
    setShowOnboarding(false);
    setBlockedClipboardText(null);
    setStage('intro');
  };

  const onOpenSettings = () => {
    previousStageRef.current = stage;
    setStage('settings');
  };

  const onCloseSettings = () => {
    setStage(previousStageRef.current);
  };

  const onAutoPasteSettingChange = async (enabled: boolean) => {
    console.log('[App] onAutoPasteSettingChange called with:', enabled, new Error().stack);
    await setAutoPasteEnabled(enabled);
  };

  const onResetOnboarding = async () => {
    await setAutoPasteEnabled(false);
    await setHasSeenOnboarding(false);
    setShowOnboarding(true);
    setStage('intro');
  };

  const onSubmitInput = async () => {
    if (!inputValue) return;
    await goToSuggestions(inputValue);
    setInputValue('');
  };

  const onSuggestionClick = (word: string) => {
    if (running) return;
    setClipboardError(null);
    const normalizedWord = word.toLowerCase();
    setTarget(normalizedWord);
    setStage('animation');
    setUnderlineActive(true);
    setHasCompletedRun(false);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
      clearPostCompleteTimer();
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

  // Determine if we're on an onboarding screen (no cog)
  const isOnboardingScreen = showOnboarding || blockedClipboardText;

  return (
    <main className="app-shell">
      {toastMessage && (
        <div className="toast-pill" role="status" aria-live="polite">
          <Check size={16} strokeWidth={2} />
          {toastMessage}
        </div>
      )}

      {/* Settings cog - always visible except on onboarding screens */}
      {!isOnboardingScreen && stage !== 'settings' && (
        <button type="button" className="settings-cog" onClick={onOpenSettings}>
          <Settings size={20} strokeWidth={1.5} />
        </button>
      )}

      {/* Onboarding: Privacy notice (first time or sensitive content detected) */}
      {showOnboarding && (
        <PrivacyWarning onGetStarted={onPrivacyGetStarted} />
      )}

      {/* Settings page */}
      {stage === 'settings' && (
        <SettingsPage
          autoPasteEnabled={settings.autoPasteEnabled}
          onAutoPasteChange={onAutoPasteSettingChange}
          onResetOnboarding={onResetOnboarding}
          onBack={onCloseSettings}
        />
      )}

      {/* Normal flow - only show if not onboarding and not settings */}
      {!showOnboarding && stage === 'intro' && (
        <IntroStage
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSubmit={onSubmitInput}
          onPasteFromClipboard={onPasteFromClipboard}
          autoPasteEnabled={settings.autoPasteEnabled}
          onAutoPasteChange={onAutoPasteSettingChange}
          disabled={serviceLoading}
        />
      )}
      {!showOnboarding && stage === 'suggestions' && (
        <SuggestionsStage
          source={source}
          suggestions={suggestions}
          suggestionsLoading={suggestionsLoading}
          running={running}
          onLogoClick={() => setStage('intro')}
          onSuggestionClick={onSuggestionClick}
          footerBar={footerBar}
        />
      )}
      {!showOnboarding && stage === 'animation' && (
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
