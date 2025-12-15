import { CornerDownLeft, ClipboardPaste } from 'lucide-react';
import { RectButton, InputField } from './DesignSystem';
import logoUrl from '../assets/unscramm-icon.png';

interface IntroStageProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onPasteFromClipboard: () => void;
  autoPasteEnabled: boolean;
  onAutoPasteChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export function IntroStage({
  inputValue,
  onInputChange,
  onSubmit,
  onPasteFromClipboard,
  autoPasteEnabled,
  onAutoPasteChange,
  disabled = false,
}: IntroStageProps) {
  console.log('[IntroStage] render, autoPasteEnabled=', autoPasteEnabled);
  return (
    <div className="stage-intro">
      <img src={logoUrl} alt="Unscramm" className="logo-top-left" />
      <div className="heading-large">Give me a word to unscramble</div>
      <RectButton className="intro-button" onClick={onPasteFromClipboard} disabled={disabled}>
        <ClipboardPaste size={14} strokeWidth={1.5} />
        Paste from Clipboard
      </RectButton>
      <InputField
        className="intro-input"
        placeholder="or type here"
        value={inputValue}
        onChange={onInputChange}
        onAction={onSubmit}
        actionIcon={<CornerDownLeft size={14} strokeWidth={1.5} />}
        disabled={disabled}
      />
      <label className="intro-autopaste-checkbox">
        <input
          type="checkbox"
          checked={autoPasteEnabled}
          onChange={(e) => {
            e.stopPropagation();
            console.log('[IntroStage] checkbox onChange, checked=', e.target.checked);
            onAutoPasteChange(e.target.checked);
          }}
        />
        <span>Auto-paste on opening window</span>
      </label>
      <div className="footer-credit absolute-bottom">
        Made with care by{' '}
        <a href="https://scrappykin.com" target="_blank" rel="noopener noreferrer">
          Scrappy Kin
        </a>
      </div>
    </div>
  );
}
