/**
 * Example test file to verify Jest setup
 */

import { jest, describe, test, expect } from '@jest/globals';
import { getCssVariableValue, wait } from '../utils/testHelpers';

describe('Jest Setup', () => {
  test('Jest is properly configured with TypeScript', () => {
    // Basic assertion to verify Jest is working
    expect(2 + 2).toBe(4);
    
    // TypeScript verification
    const typedArray: Array<number> = [1, 2, 3];
    expect(typedArray).toHaveLength(3);
  });
  
  test('CSS variables are properly set up', () => {
    // Verify the CSS variables from styleguide are correctly set
    expect(document.documentElement.style.getPropertyValue('--remove-duration')).toBe('0.4s');
    expect(document.documentElement.style.getPropertyValue('--add-duration')).toBe('0.3s');
    expect(document.documentElement.style.getPropertyValue('--reorder-duration')).toBe('1s');
    expect(document.documentElement.style.getPropertyValue('--letter-shift-duration')).toBe('0.3s');
  });
  
  test('Test helpers work correctly', async () => {
    // Test the wait function
    const startTime = Date.now();
    await wait(100);
    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeGreaterThanOrEqual(95); // Allow for small timing variations
    
    // Test the getCssVariableValue function
    document.documentElement.style.setProperty('--test-var', '10px');
    expect(getCssVariableValue(document.documentElement, 'test-var')).toBe('10px');
  });
  
  test('Jest DOM matchers are available', () => {
    // Create a test element
    const element = document.createElement('div');
    element.textContent = 'Test';
    document.body.appendChild(element);
    
    // Test jest-dom matchers
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Test');
    
    // Clean up
    element.remove();
  });
}); 