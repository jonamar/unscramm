import React from 'react';
import { render, screen } from '@testing-library/react';
import Letter from '../Letter';
import { jest } from '@jest/globals';

// Mock Framer Motion
jest.mock('framer-motion', () => {
  return {
    motion: {
      span: (props: any) => {
        const { 
          children, 
          className, 
          'data-testid': testId,
          'data-state': state,
          'data-index': index,
          animate,
          initial,
          variants,
          onAnimationComplete,
          layout,
          ...rest
        } = props;
        
        // Create a basic span with all the provided props
        return (
          <span 
            className={className}
            data-testid={testId}
            data-state={state}
            data-index={index}
          >
            {children}
          </span>
        );
      }
    },
    Variants: jest.fn()
  };
});

describe('Letter Component', () => {
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
}); 