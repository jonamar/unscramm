import { motion } from 'framer-motion';
import { RectButton } from './DesignSystem';
import logoUrl from '../assets/unscramm-icon.png';
import type { Suggestion } from '../services/spell-suggestions';
import { PASTE_ANIM } from '../utils/pasteAnimation';

interface SuggestionsStageProps {
  source: string;
  suggestions: Suggestion[];
  suggestionsLoading: boolean;
  running: boolean;
  onLogoClick: () => void;
  onSuggestionClick: (word: string) => void;
  footerBar: React.ReactNode;
}

export function SuggestionsStage({
  source,
  suggestions,
  suggestionsLoading,
  running,
  onLogoClick,
  onSuggestionClick,
  footerBar,
}: SuggestionsStageProps) {
  const containerDelay = PASTE_ANIM.container.delayS;
  const looksLikeNonWord = /[^a-zA-Z]/.test(source);

  return (
    <div className="stage-suggestions">
      <img 
        src={logoUrl} 
        alt="Unscramm" 
        className="logo-top-left" 
        onClick={onLogoClick}
      />

      <motion.div
        key={source}
        initial={{ x: PASTE_ANIM.word.offsetX, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: PASTE_ANIM.word.durationS, ease: PASTE_ANIM.word.ease }}
        className="spell-underline-animated heading-large"
      >
        {source}
        <motion.div
          aria-hidden="true"
          className="spell-underline-line"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: PASTE_ANIM.word.durationS, ease: PASTE_ANIM.word.ease }}
          style={{ transformOrigin: 'left' }}
        />
      </motion.div>

      <motion.div
        initial={{ y: PASTE_ANIM.container.offsetY, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: PASTE_ANIM.container.durationS,
          ease: PASTE_ANIM.container.ease,
          delay: containerDelay,
        }}
      >
        <div className="suggestions-label">Suggestions:</div>

        {suggestionsLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut', delay: containerDelay }}
            className="text-light"
          >
            Loading suggestions...
          </motion.div>
        ) : suggestions.length > 0 ? (
          <div className="suggestion-group">
            {suggestions.map((suggestion, index) => (
              <motion.div
                className="suggestion-row"
                key={suggestion.word}
                initial={{ x: PASTE_ANIM.item.offsetX, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{
                  duration: PASTE_ANIM.item.durationS,
                  ease: PASTE_ANIM.item.ease,
                  delay: containerDelay + index * PASTE_ANIM.item.staggerDelayS,
                }}
              >
                <RectButton
                  className="justify-start suggestion-button"
                  onClick={() => onSuggestionClick(suggestion.word)}
                  disabled={running}
                >
                  {suggestion.word}
                </RectButton>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut', delay: containerDelay }}
            className="text-light"
          >
            {looksLikeNonWord ? 'No word matches found' : 'Already spelled correctly'}
          </motion.div>
        )}
      </motion.div>
      {footerBar}
    </div>
  );
}
