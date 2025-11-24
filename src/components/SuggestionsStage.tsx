import { Check } from 'lucide-react';
import { RectButton } from './DesignSystem';
import logoUrl from '../assets/unscramm-icon.png';
import type { Suggestion } from '../services/spell-suggestions';

interface SuggestionsStageProps {
  source: string;
  suggestions: Suggestion[];
  suggestionsLoading: boolean;
  copiedWord: string | null;
  copyDots: number;
  running: boolean;
  onLogoClick: () => void;
  onSuggestionClick: (word: string) => void;
  footerBar: React.ReactNode;
}

export function SuggestionsStage({
  source,
  suggestions,
  suggestionsLoading,
  copiedWord,
  copyDots,
  running,
  onLogoClick,
  onSuggestionClick,
  footerBar,
}: SuggestionsStageProps) {
  return (
    <div className="stage-suggestions">
      <img 
        src={logoUrl} 
        alt="Unscramm" 
        className="logo-top-right" 
        onClick={onLogoClick}
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
      {footerBar}
    </div>
  );
}
