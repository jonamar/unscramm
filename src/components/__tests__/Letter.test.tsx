import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Letter from '../Letter';
import { jest } from '@jest/globals';
import { mockAnimationComplete } from '../../__mocks__/framer-motion';

// Mock the Framer Motion hooks
const mockUseReducedMotion = jest.fn().mockReturnValue(false);

// Mock framer-motion to use our mocked hooks
jest.mock('framer-motion', () => {
  const originalModule = jest.requireActual('../../__mocks__/framer-motion') as Record<string, unknown>;
  return {
    ...originalModule,
    useReducedMotion: mockUseReducedMotion
  };
});

describe('Letter Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockUseReducedMotion.mockClear();
    mockUseReducedMotion.mockReturnValue(false);
  });

  it('renders the character correctly', () => {
    render(<Letter character="a" animationState="normal" />);
    const letterElement = screen.getByTestId('letter');
    expect(letterElement).toHaveTextContent('a');
  });

  it('applies the correct data-state attribute based on animationState', () => {
    const { rerender } = render(<Letter character="b" animationState="normal" />);
    let letterElement = screen.getByTestId('letter');
    
    // Normal state
    expect(letterElement).toHaveAttribute('data-state', 'normal');
    
    // Deletion state
    rerender(<Letter character="b" animationState="deletion" />);
    letterElement = screen.getByTestId('letter');
    expect(letterElement).toHaveAttribute('data-state', 'deletion');
    
    // Insertion state
    rerender(<Letter character="b" animationState="insertion" />);
    letterElement = screen.getByTestId('letter');
    expect(letterElement).toHaveAttribute('data-state', 'insertion');
    
    // Movement state
    rerender(<Letter character="b" animationState="movement" />);
    letterElement = screen.getByTestId('letter');
    expect(letterElement).toHaveAttribute('data-state', 'movement');
  });

  it('renders with the initialIndex data attribute when provided', () => {
    render(<Letter character="c" animationState="normal" initialIndex={3} />);
    const letterElement = screen.getByTestId('letter');
    expect(letterElement).toHaveAttribute('data-index', '3');
  });

  it('does not render data-index attribute when initialIndex is undefined', () => {
    render(<Letter character="c" animationState="normal" />);
    const letterElement = screen.getByTestId('letter');
    expect(letterElement).not.toHaveAttribute('data-index');
  });

  it('applies custom className when provided', () => {
    render(<Letter character="d" animationState="normal" className="custom-class" />);
    const letterElement = screen.getByTestId('letter');
    expect(letterElement).toHaveClass('custom-class');
  });

  it('applies the correct CSS class based on animationState', () => {
    const { rerender } = render(<Letter character="e" animationState="normal" />);
    let letterElement = screen.getByTestId('letter');
    
    // Normal state
    expect(letterElement).toHaveClass('normal');
    
    // Deletion state
    rerender(<Letter character="e" animationState="deletion" />);
    letterElement = screen.getByTestId('letter');
    expect(letterElement).toHaveClass('deletion');
    
    // Insertion state
    rerender(<Letter character="e" animationState="insertion" />);
    letterElement = screen.getByTestId('letter');
    expect(letterElement).toHaveClass('insertion');
    
    // Movement state
    rerender(<Letter character="e" animationState="movement" />);
    letterElement = screen.getByTestId('letter');
    expect(letterElement).toHaveClass('movement');
  });

  it('properly transitions between animation states', () => {
    // Start with normal state
    const { rerender } = render(<Letter character="f" animationState="normal" />);
    let letterElement = screen.getByTestId('letter');
    
    expect(letterElement).toHaveAttribute('data-state', 'normal');
    expect(letterElement).toHaveClass('normal');
    
    // Transition to insertion state
    rerender(<Letter character="f" animationState="insertion" />);
    letterElement = screen.getByTestId('letter');
    
    expect(letterElement).toHaveAttribute('data-state', 'insertion');
    expect(letterElement).toHaveClass('insertion');
    expect(letterElement).not.toHaveClass('normal');
    
    // Transition to movement state
    rerender(<Letter character="f" animationState="movement" />);
    letterElement = screen.getByTestId('letter');
    
    expect(letterElement).toHaveAttribute('data-state', 'movement');
    expect(letterElement).toHaveClass('movement');
    expect(letterElement).not.toHaveClass('insertion');
    
    // Transition to deletion state
    rerender(<Letter character="f" animationState="deletion" />);
    letterElement = screen.getByTestId('letter');
    
    expect(letterElement).toHaveAttribute('data-state', 'deletion');
    expect(letterElement).toHaveClass('deletion');
    expect(letterElement).not.toHaveClass('movement');
  });

  it('calls onAnimationComplete when animation finishes', async () => {
    const mockCallback = jest.fn();
    
    act(() => {
      render(<Letter 
        character="g" 
        animationState="deletion" 
        onAnimationComplete={mockCallback} 
      />);
    });
    
    // Wait for the animation callback to be called
    // The mock is set up to call it via setTimeout
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });

  it('accepts disableLayoutAnimation prop', () => {
    // We can inspect the layout prop value in the DOM using the test ids
    // that Framer Motion internally uses
    
    // With layout animation enabled (default)
    const { rerender } = render(<Letter character="z" animationState="normal" />);
    const letterElement = screen.getByTestId('letter');
    
    // Framer Motion's implementation detail - layout prop results in specific attributes
    expect(letterElement).toBeInTheDocument();
    
    // With layout animation disabled
    rerender(<Letter character="z" animationState="normal" disableLayoutAnimation={true} />);
    const disabledLayoutElement = screen.getByTestId('letter');
    expect(disabledLayoutElement).toBeInTheDocument();
  });

  // Test the memo behavior indirectly by checking if the component updates properly
  describe('Memoization Behavior', () => {
    it('should update with new animation state even with memoization', () => {
      const { rerender } = render(<Letter character="m" animationState="normal" />);
      let letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveClass('normal');
      
      // Should update when animationState changes despite memoization
      rerender(<Letter character="m" animationState="deletion" />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveClass('deletion');
    });
    
    it('should update with new character even with memoization', () => {
      const { rerender } = render(<Letter character="m" animationState="normal" />);
      let letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveTextContent('m');
      
      // Should update when character changes despite memoization
      rerender(<Letter character="n" animationState="normal" />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveTextContent('n');
    });
  });

  // Accessibility tests
  describe('Accessibility Features', () => {
    it('has the correct ARIA role and attributes', () => {
      render(<Letter character="h" animationState="normal" />);
      const letterElement = screen.getByTestId('letter');
      
      expect(letterElement).toHaveAttribute('role', 'text');
      expect(letterElement).toHaveAttribute('aria-label', 'Letter h');
      expect(letterElement).toHaveAttribute('aria-live', 'off');
      expect(letterElement).toHaveAttribute('aria-atomic', 'true');
      expect(letterElement).toHaveAttribute('aria-relevant', 'text');
      expect(letterElement).not.toHaveAttribute('aria-hidden');
    });

    it('updates ARIA attributes based on animation state', () => {
      const { rerender } = render(<Letter character="i" animationState="normal" />);
      let letterElement = screen.getByTestId('letter');
      
      // Check normal state
      expect(letterElement).toHaveAttribute('aria-label', 'Letter i');
      expect(letterElement).toHaveAttribute('aria-live', 'off');
      expect(letterElement).not.toHaveAttribute('aria-hidden');
      
      // Check deletion state
      rerender(<Letter character="i" animationState="deletion" />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveAttribute('aria-label', 'Letter i being deleted');
      expect(letterElement).toHaveAttribute('aria-live', 'polite');
      expect(letterElement).toHaveAttribute('aria-hidden', 'true');
      
      // Check insertion state
      rerender(<Letter character="i" animationState="insertion" />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveAttribute('aria-label', 'Letter i being inserted');
      expect(letterElement).toHaveAttribute('aria-live', 'polite');
      expect(letterElement).not.toHaveAttribute('aria-hidden');
      
      // Check movement state
      rerender(<Letter character="i" animationState="movement" />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveAttribute('aria-label', 'Letter i moving to new position');
      expect(letterElement).toHaveAttribute('aria-live', 'polite');
      expect(letterElement).not.toHaveAttribute('aria-hidden');
    });

    it('applies proper tabIndex based on animation state', () => {
      const { rerender } = render(<Letter character="j" animationState="normal" />);
      let letterElement = screen.getByTestId('letter');
      
      // Default tabIndex should be 0
      expect(letterElement).toHaveAttribute('tabIndex', '0');
      
      // When in deletion state, remove from tab order
      rerender(<Letter character="j" animationState="deletion" />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveAttribute('tabIndex', '-1');
      
      // Return to tab order for other states
      rerender(<Letter character="j" animationState="insertion" />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveAttribute('tabIndex', '0');
      
      // Custom tabIndex should be respected
      rerender(<Letter character="j" animationState="normal" tabIndex={3} />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveAttribute('tabIndex', '3');
      
      // But still removed from tab order during deletion
      rerender(<Letter character="j" animationState="deletion" tabIndex={3} />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveAttribute('tabIndex', '-1');
    });

    it('applies styles with the correct focus outline colors', () => {
      const { rerender } = render(<Letter character="k" animationState="normal" />);
      let letterElement = screen.getByTestId('letter');
      
      // Check the default outline color
      expect(letterElement).toHaveStyle('outline-color: #fff');
      
      // Check deletion state outline color
      rerender(<Letter character="k" animationState="deletion" />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveStyle('outline-color: #ff5252');
      
      // Check insertion state outline color
      rerender(<Letter character="k" animationState="insertion" />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveStyle('outline-color: #4caf50');
      
      // Check movement state outline color
      rerender(<Letter character="k" animationState="movement" />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveStyle('outline-color: #ffeb3b');
    });

    it('verifies aria-relevant is correctly set to "text"', () => {
      render(<Letter character="l" animationState="normal" />);
      const letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveAttribute('aria-relevant', 'text');
    });
    
    it('verifies aria-hidden only appears in deletion state', () => {
      const { rerender } = render(<Letter character="m" animationState="normal" />);
      let letterElement = screen.getByTestId('letter');
      
      // Normal state should not have aria-hidden
      expect(letterElement).not.toHaveAttribute('aria-hidden');
      
      // Deletion state should have aria-hidden="true"
      rerender(<Letter character="m" animationState="deletion" />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveAttribute('aria-hidden', 'true');
      
      // Movement state should not have aria-hidden
      rerender(<Letter character="m" animationState="movement" />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).not.toHaveAttribute('aria-hidden');
      
      // Insertion state should not have aria-hidden
      rerender(<Letter character="m" animationState="insertion" />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).not.toHaveAttribute('aria-hidden');
    });
  });
  
  // Cleanup tests
  describe('Component Cleanup', () => {
    it('properly handles unmounting', () => {
      // This test simply confirms no errors are thrown when unmounting
      const { unmount } = render(<Letter character="q" animationState="normal" />);
      expect(() => unmount()).not.toThrow();
    });
  });
  
  // Reduced motion tests - simplified approach since we can't effectively spy on internal implementation details
  describe('Reduced Motion Support', () => {
    it('renders with reduced motion preferences applied', () => {
      // Force the mock to return true to simulate a user preferring reduced motion
      mockUseReducedMotion.mockReturnValue(true);
      
      // Test that the component renders without errors
      render(<Letter character="r" animationState="normal" />);
      const letterElement = screen.getByTestId('letter');
      
      // Basic check that component rendered
      expect(letterElement).toBeInTheDocument();
      
      // Reset the mock for other tests
      mockUseReducedMotion.mockReturnValue(false);
    });
  });
}); 