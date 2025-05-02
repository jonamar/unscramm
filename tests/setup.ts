/**
 * Global Jest setup file for unscramm
 * This file runs before each test file
 */

// Import @testing-library/jest-dom for enhanced DOM matchers
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock CSS imports for CSS Modules
// This prevents errors when importing .module.css files in tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Set up CSS variables as defined in the styleguide
document.documentElement.style.setProperty('--remove-duration', '0.4s');
document.documentElement.style.setProperty('--add-duration', '0.3s');
document.documentElement.style.setProperty('--reorder-duration', '1s');
document.documentElement.style.setProperty('--letter-shift-duration', '0.3s');

// Mock the IntersectionObserver with a more complete implementation
class MockIntersectionObserver implements IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin: string = '0px';
  thresholds: ReadonlyArray<number> = [0];
  
  constructor(private callback: IntersectionObserverCallback) {}
  
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Add custom matchers if needed
// Example: expect.extend({ ... }); 