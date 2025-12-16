import { Play, RotateCcw } from 'lucide-react';
import { CircleButton } from './DesignSystem';
import DiffVisualizer from './DiffVisualizer';
import { SpeedSelector } from './SpeedSelector';
import { getSpeedMultiplier, type AnimationSpeed } from '../utils/animationSpeed';
import logoUrl from '../assets/unscramm-icon.png';
import { DEFAULT_SPEED_MULTIPLIER } from '../utils/animationTiming';

interface AnimationStageProps {
  source: string;
  target: string;
  animateSignal: number;
  resetSignal: number;
  running: boolean;
  hasCompletedRun: boolean;
  underlineActive: boolean;
  animationSpeed: AnimationSpeed;
  onLogoClick: () => void;
  onPrimaryAction: () => void;
  onAnimationComplete: () => void;
  onSpeedChange: (speed: AnimationSpeed) => void;
  footerBar: React.ReactNode;
}

export function AnimationStage({
  source,
  target,
  animateSignal,
  resetSignal,
  running,
  hasCompletedRun,
  underlineActive,
  animationSpeed,
  onLogoClick,
  onPrimaryAction,
  onAnimationComplete,
  onSpeedChange,
  footerBar,
}: AnimationStageProps) {
  return (
    <div className="stage-animation">
      <img 
        src={logoUrl} 
        alt="Unscramm" 
        className="logo-top-left" 
        onClick={onLogoClick}
      />
      <div className="transformation-summary text-light">
        {source} → {target}
      </div>
      <div className="animation-display">
        <div className={underlineActive ? 'spell-underline' : 'spell-underline spell-underline-hidden'}>
          <DiffVisualizer
            source={source}
            target={target}
            animateSignal={animateSignal}
            resetSignal={resetSignal}
            onAnimationStart={() => {}}
            onAnimationComplete={onAnimationComplete}
            speedMultiplier={DEFAULT_SPEED_MULTIPLIER * getSpeedMultiplier(animationSpeed)}
          />
        </div>
      </div>
      <div className="animation-controls">
        <CircleButton 
          className="play-button-large"
          onClick={onPrimaryAction} 
          disabled={running || !target}
        >
          {hasCompletedRun && !running ? (
            <RotateCcw size={28} strokeWidth={1.5} className="icon-reset" />
          ) : (
            <Play
              size={28}
              strokeWidth={1.5}
              className={running || !target ? 'text-gray-500' : undefined}
            />
          )}
        </CircleButton>
        <SpeedSelector
          value={animationSpeed}
          onChange={onSpeedChange}
          disabled={running}
        />
      </div>
      {footerBar}
    </div>
  );
}
