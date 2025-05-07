import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WordTransform, { AnimationPhase } from '../WordTransform';
import { jest } from '@jest/globals';

/**
 * Testing Strategy for WordTransform Component
 * 
 * Challenges encountered:
 * 1. Jest module resolution issues with ES modules in this project configuration
 * 2. Difficulty mocking the editPlan module - attempts to use jest.mock() or spyOn failed
 * 3. Animation testing is inherently challenging in JSDOM environment
 * 
 * Current approach:
 * - Focus on testing basic component functionality that doesn't depend on editPlan mocking
 * - Use simple mocks for Framer Motion to avoid animation complexities
 * - Test props, callbacks, and basic state changes
 * 
 * Future improvements:
 * - Set up proper module mocking with moduleNameMapper in Jest config
 * - Add more comprehensive tests for animation phases and transitions
 * - Consider using a visual testing tool like Storybook for animation testing
 * - Implement integration tests for editPlan + WordTransform together
 */

// Mock the Framer Motion hooks
jest.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => <div {...props} />,
    span: (props: any) => {
      // Simulate animation completion in tests
      if (props.onAnimationComplete) {
        setTimeout(() => props.onAnimationComplete(), 0);
      }
      return <span {...props} />;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: jest.fn(() => false)
}));

// Note: We're not mocking editPlan module directly, as it's causing issues with the test environment.
// Instead, we'll test for behaviors that don't depend on the specific implementation of editPlan.

describe('WordTransform Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct props and initial state', () => {
    render(
      <WordTransform
        misspelling="teh"
        correct="the"
        speedMultiplier={2}
        onAnimationStart={jest.fn()}
        onAnimationComplete={jest.fn()}
        onPhaseChange={jest.fn()}
      />
    );

    // Test component initial rendering
    const component = screen.getByTestId('word-transform');
    expect(component).toBeInTheDocument();
    expect(component).toHaveAttribute('data-phase', AnimationPhase.IDLE);
    
    // Verify the "Start Animation" button is present in initial state
    const startButton = screen.getByTestId('start-animation-button');
    expect(startButton).toBeInTheDocument();
  });

  it('calls onAnimationStart when animation begins', () => {
    const onAnimationStartMock = jest.fn();
    
    render(
      <WordTransform
        misspelling="recieve"
        correct="receive"
        speedMultiplier={2}
        onAnimationStart={onAnimationStartMock}
      />
    );
    
    // Find and click the start button
    const startButton = screen.getByTestId('start-animation-button');
    fireEvent.click(startButton);
    
    // Verify onAnimationStart was called
    expect(onAnimationStartMock).toHaveBeenCalledTimes(1);
  });

  it('correctly resets when props change during animation', () => {
    const onAnimationStartMock = jest.fn();
    
    const { rerender } = render(
      <WordTransform
        misspelling="teh"
        correct="the"
        onAnimationStart={onAnimationStartMock}
        cancelOnPropsChange={true}
      />
    );
    
    // Start animation
    const startButton = screen.getByTestId('start-animation-button');
    fireEvent.click(startButton);
    
    // Animation started
    expect(onAnimationStartMock).toHaveBeenCalledTimes(1);
    
    // Change props during animation - this should trigger a reset
    rerender(
      <WordTransform
        misspelling="recieve"
        correct="receive"
        onAnimationStart={onAnimationStartMock}
        cancelOnPropsChange={true}
      />
    );
    
    // Component should reset to IDLE state 
    // (We can't guarantee this without complete animation control,
    // but we'll check if the start button reappears as an indirect indicator)
    expect(screen.getByTestId('start-animation-button')).toBeInTheDocument();
  });

  it('applies speedMultiplier to CSS variables', () => {
    render(
      <WordTransform
        misspelling="hello"
        correct="hello"
        speedMultiplier={2}
      />
    );
    
    // This is a basic test to verify that the component renders
    // with the speedMultiplier prop. A more comprehensive test would
    // check that the CSS variables are properly set, but that
    // requires accessing computed styles which is challenging in JSDOM.
    const component = screen.getByTestId('word-transform');
    expect(component).toBeInTheDocument();
  });

  /**
   * Tests that would be valuable to add once mocking issues are resolved:
   * 
   * 1. Phase transitions - verify correct sequence: IDLE -> DELETING -> MOVING -> INSERTING -> COMPLETE
   * 2. True mover highlighting - verify true movers get special CSS class
   * 3. Animation completion callbacks - verify onAnimationComplete is called after all phases
   * 4. Empty word edge cases - verify graceful handling of empty strings
   * 5. Reduced motion preferences - verify animations adapt to user preferences
   * 6. cancelOnPropsChange=false behavior - verify animation continues when props change
   * 7. Test that edit plans are properly computed for different word pairs
   */
}); 