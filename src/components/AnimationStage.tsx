import { Play, RotateCcw } from 'lucide-react';
import { CircleButton } from './DesignSystem';
import DiffVisualizer from './DiffVisualizer';
import { SpeedSelector, getSpeedMultiplier, type AnimationSpeed } from './SpeedSelector';
import logoUrl from '../assets/unscramm-icon.png';

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
        className="logo-top-right" 
        onClick={onLogoClick}
      />
      <div className="transformation-summary text-light">
        {source} → {target}
      </div>
      <div className="animation-display">
        <div className={underlineActive ? 'spell-underline' : undefined}>
          <DiffVisualizer
            source={source}
            target={target}
            animateSignal={animateSignal}
            resetSignal={resetSignal}
            onAnimationStart={() => {}}
            onAnimationComplete={onAnimationComplete}
            speedMultiplier={2.5 * getSpeedMultiplier(animationSpeed)}
          />
        </div>
      </div>
      <div className="flex items-center justify-center gap-4">
        <CircleButton onClick={onPrimaryAction} disabled={running || !target}>
          {hasCompletedRun && !running ? (
            <RotateCcw size={14} strokeWidth={1.5} />
          ) : (
            <Play
              size={14}
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
