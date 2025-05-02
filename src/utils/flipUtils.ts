/**
 * FLIP (First, Last, Invert, Play) utilities for smooth animations
 * These helpers will be used to create smooth transitions when reordering characters
 * 
 * @see https://aerotwist.com/blog/flip-your-animations/
 */

/**
 * Records the initial position of elements before they move
 * 
 * @param elements The DOM elements to track
 * @returns A Map of element references to their initial positions
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function recordInitialPositions(elements: HTMLElement[]) {
  // To be implemented in task 2
  return new Map();
}

/**
 * Calculates the inversion transform needed to make elements appear in their original positions
 * 
 * @param elements The DOM elements that have moved
 * @param initialPositions Map of the elements' initial positions
 * @returns A Map of element references to their inversion transforms
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function calculateInversion(elements: HTMLElement[], initialPositions: Map<HTMLElement, DOMRect>) {
  // To be implemented in task 2
  return new Map();
}

/**
 * Animates elements from their inverted position to their final position
 * 
 * @param elements The DOM elements to animate
 * @param inversionMap Map of elements to their inversion transforms
 * @param duration Animation duration in milliseconds
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export function playAnimation(elements: HTMLElement[], inversionMap: Map<HTMLElement, any>, duration: number = 300) {
  // To be implemented in task 2
} 