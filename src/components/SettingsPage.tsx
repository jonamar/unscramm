import { ArrowLeft, FlaskConical } from 'lucide-react';
import { RectButton } from './DesignSystem';
import logoUrl from '../assets/unscramm-icon.png';

const IS_DEV = import.meta.env.DEV;
const LAB_URL = 'http://localhost:5175';

interface SettingsPageProps {
  autoPasteEnabled: boolean;
  onAutoPasteChange: (enabled: boolean) => void;
  onResetOnboarding: () => void;
  onBack: () => void;
  currentSource?: string;
  currentTarget?: string;
}

export function SettingsPage({
  autoPasteEnabled,
  onAutoPasteChange,
  onResetOnboarding,
  onBack,
  currentSource,
  currentTarget,
}: SettingsPageProps) {
  const handleOpenLab = () => {
    const params = new URLSearchParams();
    if (currentSource) params.set('source', currentSource);
    if (currentTarget) params.set('target', currentTarget);
    const url = params.toString() ? `${LAB_URL}?${params}` : LAB_URL;
    window.open(url, '_blank');
  };

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

      {IS_DEV && (
        <>
          <div className="settings-section-divider" />
          <RectButton className="settings-dev-button" onClick={handleOpenLab}>
            <FlaskConical size={16} />
            Open Animation Lab
          </RectButton>
          <div className="settings-hint">
            {currentSource && currentTarget
              ? `Opens lab with "${currentSource}" → "${currentTarget}"`
              : 'Opens the animation testing environment'}
          </div>
        </>
      )}
    </div>
  );
}
