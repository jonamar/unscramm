'use client';

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { WordPair } from '../services/wordPairService';
import styles from './Controls.module.css';

export interface ControlsProps {
  /** Animation speed value (0.5 to 2) */
  speed?: number;
  /** Whether animation is currently playing */
  isPlaying?: boolean;
  /** Currently active word pair */
  currentWordPair?: WordPair;
  /** Whether to enable shuffle mode */
  isShuffle?: boolean;
  /** Handler for when play button is clicked */
  onPlay?: () => void;
  /** Handler for when reset button is clicked */
  onReset?: () => void;
  /** Handler for when shuffle button is clicked */
  onShuffle?: () => void;
  /** Handler for when speed is changed */
  onSpeedChange?: (speed: number) => void;
  /** Handler for when a new word pair is submitted */
  onWordPairSubmit?: (misspelling: string, correct: string) => void;
}

/**
 * Controls component for the animation
 * Provides inputs for misspelled/correct word pairs and control buttons
 */
const Controls: React.FC<ControlsProps> = ({
  speed = 1,
  isPlaying = false,
  currentWordPair,
  isShuffle = false,
  onPlay,
  onReset,
  onShuffle,
  onSpeedChange,
  onWordPairSubmit,
}) => {
  const [misspelling, setMisspelling] = useState<string>('');
  const [correct, setCorrect] = useState<string>('');
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const misspellingInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with current word pair if available
  useEffect(() => {
    if (currentWordPair) {
      setMisspelling(currentWordPair.misspelling);
      setCorrect(currentWordPair.correct);
    }
  }, [currentWordPair]);

  // Validate form inputs whenever they change
  useEffect(() => {
    // Basic validation - both fields must have content
    // and they must be different from each other
    const isValid = 
      misspelling.trim().length > 0 && 
      correct.trim().length > 0 && 
      misspelling.trim() !== correct.trim();
    
    setIsFormValid(isValid);
  }, [misspelling, correct]);

  // Focus the misspelling input on mount
  useEffect(() => {
    if (misspellingInputRef.current) {
      misspellingInputRef.current.focus();
    }
  }, []);

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isFormValid && onWordPairSubmit) {
      onWordPairSubmit(misspelling.trim(), correct.trim());
      
      // Only clear the form if it was actually submitted
      if (!isPlaying) {
        setMisspelling('');
        setCorrect('');
        misspellingInputRef.current?.focus();
      }
    }
  };

  // Handle speed slider change
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseFloat(e.target.value);
    if (onSpeedChange) {
      onSpeedChange(newSpeed);
    }
  };

  return (
    <div className={styles.controlsContainer}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="misspelling" className={styles.label}>
            Misspelled Word
          </label>
          <input
            id="misspelling"
            type="text"
            className={styles.textInput}
            value={misspelling}
            onChange={(e) => setMisspelling(e.target.value)}
            placeholder="Enter a misspelled word..."
            disabled={isPlaying}
            ref={misspellingInputRef}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="correct" className={styles.label}>
            Correct Word
          </label>
          <input
            id="correct"
            type="text"
            className={styles.textInput}
            value={correct}
            onChange={(e) => setCorrect(e.target.value)}
            placeholder="Enter the correct spelling..."
            disabled={isPlaying}
          />
        </div>

        <div className={styles.speedControl}>
          <label htmlFor="speed" className={styles.label}>
            Animation Speed: {speed.toFixed(1)}x
          </label>
          <input
            id="speed"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={handleSpeedChange}
            className={styles.slider}
            disabled={isPlaying}
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            type={onWordPairSubmit && !isPlaying ? 'submit' : 'button'}
            className={styles.playButton}
            onClick={isPlaying ? undefined : onPlay}
            disabled={!isFormValid || (isPlaying && !onReset)}
          >
            {isPlaying ? 'Playing...' : 'Play Animation'}
          </button>
          
          <button
            type="button"
            className={styles.shuffleButton}
            onClick={onShuffle}
            disabled={isPlaying}
          >
            {isShuffle ? 'Shuffle On' : 'Shuffle Off'}
          </button>
          
          <button
            type="button"
            className={styles.resetButton}
            onClick={onReset}
            disabled={!isPlaying && !currentWordPair}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default Controls; 