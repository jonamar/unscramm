import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Letter from '../Letter';
import { jest } from '@jest/globals';
import { mockAnimationComplete } from '../../__mocks__/framer-motion';

// Jest will automatically use the mock from src/__mocks__/framer-motion.tsx

describe('Letter Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
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

  // New test for layout optimization prop
  it('accepts disableLayoutAnimation prop', () => {
    // Without layout animation disabled (default)
    const { rerender } = render(<Letter character="z" animationState="normal" />);
    let letterElement = screen.getByTestId('letter');
    
    // Here we can't directly test the Framer Motion layout prop value,
    // but we can test that no error is thrown when rendering
    expect(letterElement).toBeInTheDocument();
    
    // With layout animation disabled
    rerender(<Letter character="z" animationState="normal" disableLayoutAnimation={true} />);
    letterElement = screen.getByTestId('letter');
    expect(letterElement).toBeInTheDocument();
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
      expect(letterElement).not.toHaveAttribute('aria-hidden', 'true');
    });

    it('updates ARIA attributes based on animation state', () => {
      const { rerender } = render(<Letter character="i" animationState="normal" />);
      let letterElement = screen.getByTestId('letter');
      
      // Check normal state
      expect(letterElement).toHaveAttribute('aria-label', 'Letter i');
      expect(letterElement).toHaveAttribute('aria-live', 'off');
      
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
      expect(letterElement).not.toHaveAttribute('aria-hidden', 'true');
      
      // Check movement state
      rerender(<Letter character="i" animationState="movement" />);
      letterElement = screen.getByTestId('letter');
      expect(letterElement).toHaveAttribute('aria-label', 'Letter i moving to new position');
      expect(letterElement).toHaveAttribute('aria-live', 'polite');
      expect(letterElement).not.toHaveAttribute('aria-hidden', 'true');
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
  });
  
  // Cleanup tests
  describe('Component Cleanup', () => {
    it('properly handles unmounting', () => {
      // This test simply confirms no errors are thrown when unmounting
      const { unmount } = render(<Letter character="q" animationState="normal" />);
      expect(() => unmount()).not.toThrow();
    });
  });
}); 