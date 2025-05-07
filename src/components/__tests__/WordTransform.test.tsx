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
    
    // Check if the animation start button is rendered
    const startButton = screen.getByTestId('start-animation-button');
    expect(startButton).toBeInTheDocument();
    expect(startButton).toHaveTextContent('Start Animation');
    
    // Check if the debug info is displayed
    expect(screen.getByText(/Phase: idle/i)).toBeInTheDocument();
    expect(screen.getByText(/Edit Plan:/i)).toBeInTheDocument();
    
    // Check if all letters from the misspelled word are rendered
    const letters = screen.getAllByTestId('letter');
    expect(letters).toHaveLength(7); // 'recieve' has 7 letters
    
    // Check the first and last letters to confirm correct content
    expect(letters[0]).toHaveTextContent('r');
    expect(letters[6]).toHaveTextContent('e');
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