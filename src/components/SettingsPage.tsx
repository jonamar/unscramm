import { ArrowLeft } from 'lucide-react';
import { RectButton } from './DesignSystem';
import logoUrl from '../assets/unscramm-icon.png';

interface SettingsPageProps {
  autoPasteEnabled: boolean;
  onAutoPasteChange: (enabled: boolean) => void;
  onResetOnboarding: () => void;
  onBack: () => void;
}

export function SettingsPage({
  autoPasteEnabled,
  onAutoPasteChange,
  onResetOnboarding,
  onBack,
}: SettingsPageProps) {
  return (
    <div className="stage-settings">
      <img src={logoUrl} alt="Unscramm" className="logo-top-left" />
      <button type="button" className="back-button" onClick={onBack}>
        <ArrowLeft size={16} strokeWidth={1.5} />
        Back
      </button>
      <div className="settings-title">Settings</div>
      <label className="settings-toggle">
        <input
          type="checkbox"
          checked={autoPasteEnabled}
          onChange={(e) => onAutoPasteChange(e.target.checked)}
        />
        <span className="settings-toggle-label">Auto-paste on opening window</span>
      </label>
      <div className="settings-hint">
        When enabled, clipboard contents will be automatically pasted when you open Unscramm.
      </div>

      <div className="settings-section-divider" />

      <RectButton className="settings-reset-button" onClick={onResetOnboarding}>
        Reset App
      </RectButton>
      <div className="settings-hint">
        Clears all saved preferences and shows the welcome screen.
      </div>
    </div>
  );
}
