import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Controls from '../Controls';
import { jest } from '@jest/globals';

describe('Controls Component', () => {
  const mockWordPair = {
    id: '1',
    misspelling: 'recieve',
    correct: 'receive',
  };

  const mockProps = {
    speed: 1,
    isPlaying: false,
    currentWordPair: mockWordPair,
    isShuffle: false,
    onPlay: jest.fn(),
    onReset: jest.fn(),
    onShuffle: jest.fn(),
    onSpeedChange: jest.fn(),
    onWordPairSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with default props', () => {
    render(<Controls />);
    
    // Check for input fields and labels
    expect(screen.getByLabelText(/misspelled word/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correct word/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/animation speed/i)).toBeInTheDocument();
    
    // Check for buttons
    expect(screen.getByRole('button', { name: /play animation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shuffle off/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  test('initializes with current word pair', () => {
    render(<Controls currentWordPair={mockWordPair} />);
    
    const misspellingInput = screen.getByLabelText(/misspelled word/i) as HTMLInputElement;
    const correctInput = screen.getByLabelText(/correct word/i) as HTMLInputElement;
    
    expect(misspellingInput.value).toBe('recieve');
    expect(correctInput.value).toBe('receive');
  });

  test('form validation disables Play button when inputs are invalid', async () => {
    render(<Controls />);
    
    const playButton = screen.getByRole('button', { name: /play animation/i });
    expect(playButton).toBeDisabled();
    
    // Same text in both fields should keep button disabled
    const misspellingInput = screen.getByLabelText(/misspelled word/i);
    const correctInput = screen.getByLabelText(/correct word/i);
    
    // Using fireEvent instead of userEvent for more direct control
    fireEvent.change(misspellingInput, { target: { value: 'test' } });
    expect(playButton).toBeDisabled();
    
    fireEvent.change(correctInput, { target: { value: 'test' } });
    expect(playButton).toBeDisabled();
    
    // Different text should enable the button
    fireEvent.change(correctInput, { target: { value: 'test123' } });
    
    // Wait for state to update
    await waitFor(() => {
      expect(playButton).not.toBeDisabled();
    });
  });

  test('submits form and calls onWordPairSubmit when Play is clicked', async () => {
    render(<Controls {...mockProps} />);
    
    const misspellingInput = screen.getByLabelText(/misspelled word/i);
    const correctInput = screen.getByLabelText(/correct word/i);
    
    // Clear and then set values using fireEvent
    fireEvent.change(misspellingInput, { target: { value: 'seperate' } });
    fireEvent.change(correctInput, { target: { value: 'separate' } });
    
    // Wait for validation to complete and button to be enabled
    await waitFor(() => {
      const playButton = screen.getByRole('button', { name: /play animation/i });
      expect(playButton).not.toBeDisabled();
    });
    
    // Now click the button
    const playButton = screen.getByRole('button', { name: /play animation/i });
    fireEvent.click(playButton);
    
    await waitFor(() => {
      expect(mockProps.onWordPairSubmit).toHaveBeenCalledWith('seperate', 'separate');
    });
  });

  test('calls onSpeedChange when slider is adjusted', () => {
    render(<Controls {...mockProps} />);
    
    const slider = screen.getByLabelText(/animation speed/i);
    fireEvent.change(slider, { target: { value: '1.5' } });
    
    expect(mockProps.onSpeedChange).toHaveBeenCalledWith(1.5);
  });

  test('calls onShuffle when Shuffle button is clicked', () => {
    render(<Controls {...mockProps} />);
    
    const shuffleButton = screen.getByRole('button', { name: /shuffle off/i });
    fireEvent.click(shuffleButton);
    
    expect(mockProps.onShuffle).toHaveBeenCalledTimes(1);
  });

  test('calls onReset when Reset button is clicked', () => {
    render(<Controls {...mockProps} currentWordPair={mockWordPair} isPlaying={true} />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);
    
    expect(mockProps.onReset).toHaveBeenCalledTimes(1);
  });

  test('displays "Playing..." text when isPlaying is true', () => {
    render(<Controls {...mockProps} isPlaying={true} />);
    
    expect(screen.getByRole('button', { name: /playing/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /play animation/i })).not.toBeInTheDocument();
  });

  test('displays "Shuffle On" when isShuffle is true', () => {
    render(<Controls {...mockProps} isShuffle={true} />);
    
    expect(screen.getByRole('button', { name: /shuffle on/i })).toBeInTheDocument();
  });

  test('input fields are disabled when isPlaying is true', () => {
    render(<Controls {...mockProps} isPlaying={true} />);
    
    const misspellingInput = screen.getByLabelText(/misspelled word/i);
    const correctInput = screen.getByLabelText(/correct word/i);
    const slider = screen.getByLabelText(/animation speed/i);
    
    expect(misspellingInput).toBeDisabled();
    expect(correctInput).toBeDisabled();
    expect(slider).toBeDisabled();
  });

  test('Reset button is disabled when no animation is playing and no current word pair exists', () => {
    render(<Controls {...mockProps} currentWordPair={undefined} />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    expect(resetButton).toBeDisabled();
  });

  test('Reset button is enabled when animation is playing', () => {
    render(<Controls {...mockProps} isPlaying={true} currentWordPair={undefined} />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    expect(resetButton).not.toBeDisabled();
  });
}); 