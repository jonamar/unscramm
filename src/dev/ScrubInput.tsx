import { useRef, useCallback, useState, useEffect } from 'react';
import { GripVertical } from 'lucide-react';

interface ScrubInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export function ScrubInput({
  label,
  value,
  onChange,
  min = 0,
  max = 2000,
  step = 10,
  unit = 'ms',
}: ScrubInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [inputValue, setInputValue] = useState(String(value));
  const [previewValue, setPreviewValue] = useState<number | null>(null);
  const dragStartX = useRef(0);
  const dragStartValue = useRef(0);

  // Sync input value when prop changes (and not actively dragging)
  useEffect(() => {
    if (!isDragging) {
      setInputValue(String(value));
    }
  }, [value, isDragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartValue.current = value;
    setPreviewValue(value);
    document.body.style.cursor = 'ew-resize';
  }, [value]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - dragStartX.current;
      const sensitivity = e.shiftKey ? 0.1 : 1; // Hold shift for fine control
      const newValue = Math.round(
        Math.max(min, Math.min(max, dragStartValue.current + delta * sensitivity * (step / 2)))
      );
      // Live update the preview (visual only)
      setPreviewValue(newValue);
      setInputValue(String(newValue));
    };

    const handleMouseUp = () => {
      // Commit the value on release
      if (previewValue !== null) {
        onChange(previewValue);
      }
      setPreviewValue(null);
      setIsDragging(false);
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, step, onChange, previewValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    } else {
      setInputValue(String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(max, value + step));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(min, value - step));
    }
  };

  return (
    <div className={`scrub-input ${isDragging ? 'scrub-input--dragging' : ''}`}>
      <span
        className="scrub-input__handle"
        onMouseDown={handleMouseDown}
        title="Drag to adjust"
      >
        <GripVertical size={12} />
      </span>
      <span className="scrub-input__label">{label}</span>
      <input
        type="text"
        className="scrub-input__field"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
      />
      <span className="scrub-input__unit">{unit}</span>
    </div>
  );
}
