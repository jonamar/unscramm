import { motion } from 'framer-motion';
import { RectButton } from './DesignSystem';
import { PASTE_ANIM } from '../utils/pasteAnimation';
import logoUrl from '../assets/unscramm-icon.png';

interface PrivacyWarningProps {
  onGetStarted: () => void;
}

export function PrivacyWarning({ onGetStarted }: PrivacyWarningProps) {
  return (
    <motion.div
      className="privacy-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: PASTE_ANIM.word.durationS, ease: PASTE_ANIM.word.ease }}
    >
      <img src={logoUrl} alt="Unscramm" className="intro-logo" />
      <div className="privacy-screen-title">Private by default.</div>
      <div className="privacy-screen-body">
        Unscramble runs entirely on your Mac. Text you paste stays on your device and is never sent anywhere.
      </div>
      <div className="privacy-screen-body">
        We'll sometimes give you a gentle heads-up before pasting, just in case you're in public or working with something sensitive. You're always in control.
      </div>
      <RectButton className="privacy-screen-cta" onClick={onGetStarted}>
        Get Started
      </RectButton>
    </motion.div>
  );
}
