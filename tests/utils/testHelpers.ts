/**
 * Test helper utilities for unscramm tests
 */

/**
 * Wait for a specific duration in milliseconds
 * Useful for testing animations or async operations
 * @param ms - Duration to wait in milliseconds
 */
export const wait = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get computed CSS variable value from an element
 * @param element - DOM element to inspect
 * @param variableName - CSS variable name (without the -- prefix)
 * @returns The computed value of the CSS variable
 */
export const getCssVariableValue = (
  element: Element, 
  variableName: string
): string => {
  const styles = getComputedStyle(element);
  return styles.getPropertyValue(`--${variableName}`).trim();
};

/**
 * Create mock DOM elements for testing animations
 * @param letters - Array of letters to create elements for
 * @returns Array of span elements with proper styling and content
 */
export const createLetterElements = (letters: string[]): HTMLSpanElement[] => {
  return letters.map((letter, index) => {
    const span = document.createElement('span');
    span.textContent = letter;
    span.className = 'letter';
    span.dataset.index = String(index);
    span.style.position = 'relative';
    return span;
  });
};

/**
 * Get animation duration in milliseconds from a CSS time value
 * @param cssTimeValue - CSS time value (e.g. '0.5s' or '500ms')
 * @returns Duration in milliseconds
 */
export const getAnimationDurationMs = (cssTimeValue: string): number => {
  if (cssTimeValue.endsWith('ms')) {
    return parseInt(cssTimeValue, 10);
  }
  if (cssTimeValue.endsWith('s')) {
    return parseFloat(cssTimeValue) * 1000;
  }
  return 0;
};

/**
 * Test if an element has a specific transform applied
 * @param element - DOM element to test
 * @param expectedTransform - Expected transform value or partial match
 * @returns Boolean indicating if the element has the expected transform
 */
export const hasTransform = (
  element: HTMLElement, 
  expectedTransform: string
): boolean => {
  const transform = element.style.transform || '';
  return transform.includes(expectedTransform);
}; 