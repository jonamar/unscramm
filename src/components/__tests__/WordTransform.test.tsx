import React from 'react';
import { render, screen } from '@testing-library/react';
import WordTransform, { AnimationPhase } from '../WordTransform';
import { jest } from '@jest/globals';

// Mock the Framer Motion hooks
jest.mock('framer-motion', () => {
  // Using any here to avoid TypeScript issues with the mock
  const actual = jest.requireActual('../../__mocks__/framer-motion') as any;
  return {
    ...actual.default,
    useReducedMotion: jest.fn().mockReturnValue(false)
  };
});

describe('WordTransform Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders with correct props and initial state', () => {
    render(
      <WordTransform 
        misspelling="recieve" 
        correct="receive" 
        speed={1}
        colorsEnabled={true}
      />
    );
    
    // Check if the component rendered with correct props
    const component = screen.getByTestId('word-transform');
    expect(component).toBeInTheDocument();
    expect(component).toHaveAttribute('data-phase', 'idle');
    expect(component).toHaveAttribute('data-colors-enabled', 'true');
    
    // Check if the wordContainer is rendered
    const wordContainer = screen.getByTestId('word-transform').querySelector('#wordContainer');
    expect(wordContainer).toBeInTheDocument();
    
    // Check if the words are displayed (this is just for the skeleton implementation)
    expect(screen.getByText(/Misspelled: recieve/i)).toBeInTheDocument();
    expect(screen.getByText(/Correct: receive/i)).toBeInTheDocument();
  });

  it('handles colorsEnabled prop correctly', () => {
    const { rerender } = render(
      <WordTransform 
        misspelling="recieve" 
        correct="receive" 
        colorsEnabled={true}
      />
    );
    
    // Check colorsEnabled=true
    expect(screen.getByTestId('word-transform')).toHaveAttribute('data-colors-enabled', 'true');
    
    // Rerender with colorsEnabled=false
    rerender(
      <WordTransform 
        misspelling="recieve" 
        correct="receive" 
        colorsEnabled={false}
      />
    );
    
    // Check colorsEnabled=false
    expect(screen.getByTestId('word-transform')).toHaveAttribute('data-colors-enabled', 'false');
  });

  it('applies the correct data-phase attribute', () => {
    render(
      <WordTransform 
        misspelling="recieve" 
        correct="receive" 
      />
    );
    
    // Initially should be in idle phase
    const component = screen.getByTestId('word-transform');
    expect(component).toHaveAttribute('data-phase', 'idle');
  });

  // Additional tests would cover the animation phase transitions,
  // but that will be implemented in subsequent subtasks
}); 