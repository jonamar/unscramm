import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import WordTransformFSM, { WordTransformTestingAPI } from '../WordTransformFSM';
import '@testing-library/jest-dom';
// computeEditPlan is imported for mocking but not directly used in tests
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { computeEditPlan } from '../../utils/editPlan';
import { jest } from '@jest/globals';

// Mock the editPlan module and its computeEditPlan function
jest.mock('../../../src/utils/editPlan', () => ({
  computeEditPlan: jest.fn().mockImplementation((sourceWord, targetWord) => {
    // Provide different mocks based on input words for more specific testing
    if (sourceWord === "teh" && targetWord === "the") {
      return {
        deletions: [],
        insertions: [],
        moves: [{fromIndex: 1, toIndex: 2}, {fromIndex: 2, toIndex: 1}],
        highlightIndices: [1], // Mark index 1 as a true mover
      };
    }
    
    if (sourceWord === "recieve" && targetWord === "receive") {
      return {
        deletions: [],
        insertions: [],
        moves: [{fromIndex: 3, toIndex: 4}, {fromIndex: 4, toIndex: 3}],
        highlightIndices: [3], // Mark index 3 as a true mover
      };
    }
    
    if (sourceWord === "hello" && targetWord === "hillo") {
      return {
        deletions: [1],       // Delete 'e'
        insertions: [{letter: 'i', position: 1}], // Insert 'i'
        moves: [{fromIndex: 2, toIndex: 3}],      // Move 'l'
        highlightIndices: [2], // Mark index 2 as a true mover
      };
    }
    
    // Default mock return
    return {
      deletions: [0],
      insertions: [{letter: 'i', position: 3}],
      moves: [{fromIndex: 1, toIndex: 2}],
      highlightIndices: [1],
    };
  })
}), { virtual: true });

// Mock the Framer Motion hooks
jest.mock('framer-motion', () => ({
  motion: {
    div: (props: React.HTMLAttributes<HTMLDivElement> & { 
      onAnimationComplete?: () => void,
      variants?: Record<string, unknown>,
      animate?: string | Record<string, unknown>
    }) => <div {...props} />,
    span: (props: React.HTMLAttributes<HTMLSpanElement> & {
      onAnimationComplete?: () => void,
      variants?: Record<string, unknown>,
      animate?: string | Record<string, unknown>
    }) => {
      // Simulate animation completion in tests
      if (props.onAnimationComplete) {
        setTimeout(() => {
          if (props.onAnimationComplete) {
            props.onAnimationComplete();
          }
        }, 10);
      }
      return <span {...props} />;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePresence: jest.fn(() => [true, jest.fn()]),
  useReducedMotion: jest.fn(() => false)
}));

describe('WordTransformFSM Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Use fake timers for deterministic animation testing
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with correct props and initial state', () => {
    render(
      <WordTransformFSM
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
    expect(component).toHaveAttribute('data-phase', 'idle');
    
    // Verify the "Start Animation" button is present in initial state
    const startButton = screen.getByTestId('start-animation-button');
    expect(startButton).toBeInTheDocument();
  });

  it('calls onAnimationStart when animation begins', () => {
    const onAnimationStartMock = jest.fn();
    
    render(
      <WordTransformFSM
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

  it('transitions through animation phases correctly', () => {
    render(
      <WordTransformFSM
        misspelling="hello"
        correct="hillo"
      />
    );
    
    const component = screen.getByTestId('word-transform');
    
    // Initial state should be idle
    expect(component).toHaveAttribute('data-phase', 'idle');
    
    // Start the animation
    const startButton = screen.getByTestId('start-animation-button');
    fireEvent.click(startButton);
    
    // Phase should now be deleting, moving, inserting, or complete
    // Since the state transitions can be immediate if there's nothing to do,
    // we'll just check that we're not in idle anymore
    expect(component).not.toHaveAttribute('data-phase', 'idle');
    
    // Function to simulate animation completions
    const simulateAnimationPhase = () => {
      act(() => {
        for (let i = 0; i < 10; i++) {
          jest.advanceTimersByTime(10);
        }
      });
    };
    
    // Run multiple times to ensure we go through all phases
    simulateAnimationPhase();
    simulateAnimationPhase();
    simulateAnimationPhase();
    simulateAnimationPhase();
    
    // By now, we should have reached 'complete' phase
    expect(component).toHaveAttribute('data-phase', 'complete');
  });

  it('calls onAnimationComplete when animation completes', () => {
    const onAnimationCompleteMock = jest.fn();
    
    render(
      <WordTransformFSM
        misspelling="hello"
        correct="hillo"
        onAnimationComplete={onAnimationCompleteMock}
      />
    );
    
    // Start the animation
    const startButton = screen.getByTestId('start-animation-button');
    fireEvent.click(startButton);
    
    // Simulate animation completion for all phases
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    // onAnimationComplete should be called once the animation reaches the complete phase
    expect(onAnimationCompleteMock).toHaveBeenCalledTimes(1);
  });

  it('correctly resets when props change during animation', () => {
    const onAnimationStartMock = jest.fn();
    
    const { rerender } = render(
      <WordTransformFSM
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
      <WordTransformFSM
        misspelling="recieve"
        correct="receive"
        onAnimationStart={onAnimationStartMock}
        cancelOnPropsChange={true}
      />
    );
    
    // Component should reset to idle state
    act(() => {
      jest.advanceTimersByTime(50);
    });
    
    // Check that we're back to idle state
    expect(screen.getByTestId('word-transform')).toHaveAttribute('data-phase', 'idle');
  });

  it('continues animation when props change during animation with cancelOnPropsChange=false', () => {
    const onAnimationStartMock = jest.fn();
    const onPhaseChangeMock = jest.fn();
    
    const { rerender } = render(
      <WordTransformFSM
        misspelling="teh"
        correct="the"
        onAnimationStart={onAnimationStartMock}
        onPhaseChange={onPhaseChangeMock}
        cancelOnPropsChange={false}
      />
    );
    
    // Start animation
    const startButton = screen.getByTestId('start-animation-button');
    fireEvent.click(startButton);
    
    // Animation started
    expect(onAnimationStartMock).toHaveBeenCalledTimes(1);
    
    // Reset the mock to track only calls after props change
    onPhaseChangeMock.mockReset();
    
    // Change props during animation - this should NOT trigger a reset
    rerender(
      <WordTransformFSM
        misspelling="recieve"
        correct="receive"
        onAnimationStart={onAnimationStartMock}
        onPhaseChange={onPhaseChangeMock}
        cancelOnPropsChange={false}
      />
    );
    
    // Advance timers to simulate animation continuing
    act(() => {
      jest.advanceTimersByTime(50);
    });
    
    // The animation should continue without resetting to idle
    expect(onPhaseChangeMock).not.toHaveBeenCalledWith('idle');
  });

  it('handles empty input transitions correctly', () => {
    // Start with valid inputs
    const { rerender } = render(
      <WordTransformFSM
        misspelling="test"
        correct="tests"
      />
    );
    
    // Should see the Start Animation button
    expect(screen.getByTestId('start-animation-button')).toBeInTheDocument();
    
    // Change to empty inputs
    rerender(
      <WordTransformFSM
        misspelling=""
        correct="tests"
      />
    );
    
    // The component should still render without errors
    expect(screen.getByTestId('word-transform')).toBeInTheDocument();
  });
}); 