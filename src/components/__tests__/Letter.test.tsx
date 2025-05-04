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
}); 