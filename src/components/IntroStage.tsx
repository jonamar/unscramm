import { CornerDownLeft, ClipboardPaste } from 'lucide-react';
import { RectButton, InputField } from './DesignSystem';
import logoUrl from '../assets/unscramm-icon.png';

interface IntroStageProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onPasteFromClipboard: () => void;
  disabled?: boolean;
}

export function IntroStage({
  inputValue,
  onInputChange,
  onSubmit,
  onPasteFromClipboard,
  disabled = false,
}: IntroStageProps) {
  return (
    <div className="stage-intro">
      <img src={logoUrl} alt="Unscramm" className="intro-logo" />
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
      <div className="footer-credit absolute-bottom">
        Made with care by{' '}
        <a href="https://scrappykin.com" target="_blank" rel="noopener noreferrer">
          Scrappy Kin
        </a>
      </div>
    </div>
  );
}
