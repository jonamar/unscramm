/**
 * Tests for animation-related utility functions
 */

import { describe, test, expect } from '@jest/globals';
import { getAnimationDurationMs, createLetterElements } from '../utils/testHelpers';

describe('Animation Utilities', () => {
  test('getAnimationDurationMs converts CSS time values correctly', () => {
    // Test seconds conversion
    expect(getAnimationDurationMs('0.5s')).toBe(500);
    expect(getAnimationDurationMs('2s')).toBe(2000);
    expect(getAnimationDurationMs('0.01s')).toBe(10);
    
    // Test milliseconds conversion
    expect(getAnimationDurationMs('500ms')).toBe(500);
    expect(getAnimationDurationMs('50ms')).toBe(50);
    
    // Test invalid formats
    expect(getAnimationDurationMs('')).toBe(0);
    expect(getAnimationDurationMs('invalid')).toBe(0);
  });
  
  test('createLetterElements creates DOM elements with proper attributes', () => {
    const letters = ['a', 'b', 'c'];
    const elements = createLetterElements(letters);
    
    // Check array length
    expect(elements).toHaveLength(3);
    
    // Check elements
    expect(elements[0]).toBeInstanceOf(HTMLSpanElement);
    expect(elements[0].textContent).toBe('a');
    expect(elements[0].className).toBe('letter');
    expect(elements[0].dataset.index).toBe('0');
    
    // Check second element
    expect(elements[1].textContent).toBe('b');
    expect(elements[1].dataset.index).toBe('1');
    
    // Check position style
    expect(elements[0].style.position).toBe('relative');
  });
}); 