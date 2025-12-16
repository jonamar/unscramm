import { useState, useEffect } from 'react';
import { ChevronDown, Rabbit, Turtle, Snail } from 'lucide-react';

import type { AnimationSpeed } from '../utils/animationSpeed';

const SPEED_CONFIG: Record<AnimationSpeed, { icon: typeof Snail; label: string }> = {
  snail: { icon: Snail, label: 'Snail' },
  turtle: { icon: Turtle, label: 'Turtle' },
  rabbit: { icon: Rabbit, label: 'Rabbit' },
};

interface SpeedSelectorProps {
  value: AnimationSpeed;
  onChange: (speed: AnimationSpeed) => void;
  disabled?: boolean;
}

export function SpeedSelector({ value, onChange, disabled = false }: SpeedSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    
    const handleClickOutside = () => setDropdownOpen(false);
    document.addEventListener('click', handleClickOutside);
    
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  const SpeedIcon = SPEED_CONFIG[value].icon;

  return (
    <div className="speed-selector">
      <button
        className="ds-rect-button speed-button"
        onClick={(e) => {
          e.stopPropagation();
          setDropdownOpen(!dropdownOpen);
        }}
        disabled={disabled}
      >
        <SpeedIcon size={14} strokeWidth={1.5} />
        <ChevronDown size={14} strokeWidth={1.5} />
      </button>
      {dropdownOpen && (
        <div className="speed-dropdown">
          {(Object.keys(SPEED_CONFIG) as AnimationSpeed[]).map((speed) => {
            const config = SPEED_CONFIG[speed];
            const SpeedIconOption = config.icon;
            return (
              <button
                key={speed}
                className="speed-option"
                onClick={() => {
                  onChange(speed);
                  setDropdownOpen(false);
                }}
              >
                <SpeedIconOption size={14} strokeWidth={1.5} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
