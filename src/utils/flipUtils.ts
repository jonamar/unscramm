/**
 * FLIP Animation Utilities
 * 
 * FLIP stands for First, Last, Invert, Play - a technique for performant animations:
 * 1. First: Record the initial position of elements
 * 2. Last: Re-position elements in the DOM to their final position
 * 3. Invert: Apply transforms to make elements appear in their initial position
 * 4. Play: Animate the transforms away, creating a smooth transition to the final state
 * 
 * These utilities help implement the FLIP technique for smooth animations when
 * reordering, adding, or removing elements.
 * 
 * @example
 * // Basic usage example:
 * 
 * // 1. First: Record positions before DOM changes
 * const letters = document.querySelectorAll('.letter');
 * const positions = recordPositions(Array.from(letters));
 * 
 * // 2. Last: Make your DOM changes (e.g., reordering elements)
 * reorderLetters(); // Your function that changes the DOM
 * 
 * // 3. Invert: Apply transforms to make elements appear in their original positions
 * applyInvertedTransforms(positions, 1.5); // 1.5 = exaggeration factor for emphasis
 * 
 * // 4. Play: Animate to final positions
 * clearTransformsAfterReflow(Array.from(letters), 0.8); // 0.8s duration
 * 
 * // Or use the all-in-one helper:
 * performFlipAnimation(
 *   Array.from(letters),
 *   reorderLetters,
 *   1.5, // exaggeration factor
 *   0.8  // duration in seconds
 * );
 */

/**
 * Animation type constants for different visual treatments
 */
export enum AnimationType {
  /** Standard animation for elements that move */
  MOVEMENT = 'movement',
  /** Animation for elements being deleted */
  DELETION = 'deletion',
  /** Animation for elements being inserted */
  INSERTION = 'insertion'
}

/**
 * Default animation durations in milliseconds
 */
export const AnimationDuration = {
  /** Standard animation duration */
  DEFAULT: 300,
  /** Quick animation for simple changes */
  FAST: 150,
  /** Slower animation for emphasis */
  SLOW: 500
};

/**
 * CSS easing functions for animations
 */
export const AnimationEasing = {
  /** Smooth acceleration and deceleration */
  EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Gradual acceleration */
  EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Gradual deceleration */
  EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)'
};

/**
 * Animation configuration options
 */
export interface AnimationConfig {
  /** Duration of the animation in milliseconds */
  duration?: number;
  /** CSS easing function to use */
  easing?: string;
  /** Delay before starting the animation in milliseconds */
  delay?: number;
  /** Type of animation (affects visual treatment) */
  type?: AnimationType;
  /** Whether to exaggerate the motion for emphasis */
  exaggerate?: boolean;
  /** Factor by which to exaggerate motion (default: 1.2) */
  exaggerationFactor?: number;
}

/**
 * Default animation configuration
 */
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: AnimationDuration.DEFAULT,
  easing: AnimationEasing.EASE_IN_OUT,
  delay: 0,
  type: AnimationType.MOVEMENT,
  exaggerate: false,
  exaggerationFactor: 1.2
};

/**
 * Position data for an element
 * Contains element reference and position information
 */
export interface PositionData {
  /** The HTML element reference */
  element: HTMLElement;
  /** Left position relative to viewport */
  left: number;
  /** Top position relative to viewport */
  top: number;
  /** Element width */
  width: number;
  /** Element height */
  height: number;
  /** The element's bounding rectangle (optional) */
  rect?: DOMRect;
}

/**
 * Represents a transform to move an element
 */
export interface ElementTransform {
  /** The HTML element reference */
  element: HTMLElement;
  /** The translateX value (in pixels) */
  translateX: number;
  /** The translateY value (in pixels) */
  translateY: number;
  /** The scaleX value (unitless multiplier) */
  scaleX: number;
  /** The scaleY value (unitless multiplier) */
  scaleY: number;
  /** Whether this transform requires special highlighting (e.g., true mover) */
  isHighlighted?: boolean;
}

/**
 * Records the current position of all elements
 * 
 * This is the "First" step in the FLIP technique, recording the initial positions
 * before any DOM changes occur.
 * 
 * @param elements - Array of HTML elements to capture position data for
 * @returns Array of position data objects with element references and their positions
 */
export function recordPositions(elements: HTMLElement[]): PositionData[] {
  return elements.map(element => {
    const rect = element.getBoundingClientRect();
    return {
      element,
      rect,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  });
}

/**
 * Apply inverted transforms to move elements back to their initial positions
 * 
 * This is the "Invert" step in the FLIP technique - applying transforms to make 
 * elements appear in their original positions after the DOM has been updated.
 * 
 * @param positions - Array of position data captured before DOM changes
 * @param exaggerationFactor - Optional factor to exaggerate movement for visual effect (default: 1.0)
 * @param highlightIndices - Optional array of indices in the positions array to mark for special highlighting
 */
export function applyInvertedTransforms(
  positions: PositionData[],
  exaggerationFactor: number = 1.0,
  highlightIndices: number[] = []
): void {
  positions.forEach((position, index) => {
    const element = position.element;
    const newRect = element.getBoundingClientRect();
    
    // Calculate the difference between old and new positions
    const deltaX = position.left - newRect.left;
    const deltaY = position.top - newRect.top;
    
    // Calculate any size changes
    const scaleX = position.width / Math.max(newRect.width, 1); // Avoid division by zero
    const scaleY = position.height / Math.max(newRect.height, 1);
    
    // Apply the transform
    let transform = '';
    
    // Apply exaggerated transform for horizontal movement
    if (deltaX !== 0) {
      const exaggeratedX = deltaX * exaggerationFactor;
      transform += `translateX(${exaggeratedX}px) `;
    }
    
    // Add Y transform if needed
    if (deltaY !== 0) {
      transform += `translateY(${deltaY}px) `;
    }
    
    // Add scale if needed
    if (scaleX !== 1 || scaleY !== 1) {
      transform += `scale(${scaleX}, ${scaleY})`;
    }
    
    // Apply the transform
    element.style.transform = transform.trim();
    element.style.transformOrigin = 'center';
    
    // Ensure no transition is applied initially
    element.style.transition = 'none';
    
    // Add highlight class if specified
    if (highlightIndices.includes(index)) {
      element.classList.add('flip-highlight');
    }
    
    // Force reflow to ensure transforms are applied immediately
    // eslint-disable-next-line no-unused-expressions
    element.offsetHeight;
  });
}

/**
 * Clear transforms after a reflow to allow animation to final positions
 * 
 * This is the "Play" step in the FLIP technique - transitioning elements smoothly 
 * from their apparent initial positions to their actual new positions.
 * 
 * @param elements - Elements to clear transforms from
 * @param duration - Animation duration in seconds (default: 1.0)
 * @param easing - CSS easing function (default: cubic-bezier(0.25, 1, 0.5, 1))
 * @returns A promise that resolves when the animation completes
 */
export function clearTransformsAfterReflow(
  elements: HTMLElement[],
  duration: number = 1.0,
  easing: string = 'cubic-bezier(0.25, 1, 0.5, 1)'
): Promise<void> {
  // Force a reflow to ensure transforms are applied before animating them away
  // eslint-disable-next-line no-unused-expressions
  document.body.offsetHeight;
  
  // Apply transition and clear transforms
  elements.forEach(element => {
    element.style.transition = `transform ${duration}s ${easing}`;
    element.style.transform = '';
  });
  
  // Return a promise that resolves when the animation completes
  return new Promise<void>(resolve => {
    if (elements.length === 0) {
      resolve();
      return;
    }
    
    const firstElement = elements[0];
    
    const handleTransitionEnd = () => {
      firstElement.removeEventListener('transitionend', handleTransitionEnd);
      // Clean up the transitions after animation
      elements.forEach(element => {
        element.classList.remove('flip-highlight');
      });
      resolve();
    };
    
    firstElement.addEventListener('transitionend', handleTransitionEnd);
    
    // Safety timeout in case the transition event doesn't fire
    setTimeout(() => {
      if (firstElement) {
        firstElement.removeEventListener('transitionend', handleTransitionEnd);
        resolve();
      }
    }, duration * 1000 + 50);
  });
}

/**
 * Complete FLIP animation in one function call
 * 
 * This utility combines all FLIP steps into a single, easy-to-use function
 * 
 * @param elements - Elements to animate
 * @param reorderCallback - Function that performs the DOM reordering
 * @param exaggerationFactor - Factor to exaggerate movement (default: 1.5)
 * @param duration - Animation duration in seconds (default: 1.0)
 * @param easing - CSS easing function (default: cubic-bezier(0.25, 1, 0.5, 1))
 * @param highlightIndices - Optional indices of elements to highlight (default: [])
 * @returns A promise that resolves when the animation completes
 */
export function performFlipAnimation(
  elements: HTMLElement[],
  reorderCallback: () => void,
  exaggerationFactor: number = 1.5,
  duration: number = 1.0,
  easing: string = 'cubic-bezier(0.25, 1, 0.5, 1)',
  highlightIndices: number[] = []
): Promise<void> {
  // First - record positions
  const initialPositions = recordPositions(elements);
  
  // Last - perform the reordering
  reorderCallback();
  
  // Invert - apply transforms to make it appear unchanged
  applyInvertedTransforms(initialPositions, exaggerationFactor, highlightIndices);
  
  // Play - remove transforms to animate to final positions
  return clearTransformsAfterReflow(elements, duration, easing);
}

/**
 * Checks if a transform represents a significant movement that should be animated.
 * 
 * @param transform - The transform to check
 * @param threshold - Movement threshold in pixels (default: 0.5)
 * @returns True if the transform represents a significant movement
 */
export function isSignificantTransform(
  transform: ElementTransform,
  threshold: number = 0.5
): boolean {
  const { translateX, translateY, scaleX, scaleY } = transform;
  
  // Check if any dimension changed significantly
  return (
    Math.abs(translateX) > threshold ||
    Math.abs(translateY) > threshold ||
    Math.abs(scaleX - 1) > threshold / 100 ||
    Math.abs(scaleY - 1) > threshold / 100
  );
}

/**
 * Calculates the necessary transform to move elements from their current position
 * back to their original position.
 * 
 * @deprecated Use applyInvertedTransforms instead which directly applies the transforms
 * @param initialStates - Element states captured before DOM changes
 * @param highlightIndices - Optional array of indices in the initialStates array to mark as highlighted
 * @returns Array of transform objects
 */
export function calculateElementTransform(
  initialStates: PositionData[],
  highlightIndices: number[] = []
): ElementTransform[] {
  return initialStates.map((initialState, index) => {
    // Get current position after DOM changes
    const currentRect = initialState.element.getBoundingClientRect();
    
    // Calculate the difference between initial and current positions
    const deltaX = initialState.left - currentRect.left;
    const deltaY = initialState.top - currentRect.top;
    
    // Calculate any size changes
    const scaleX = initialState.width / Math.max(currentRect.width, 1); // Avoid division by zero
    const scaleY = initialState.height / Math.max(currentRect.height, 1);
    
    return {
      element: initialState.element,
      translateX: deltaX,
      translateY: deltaY,
      scaleX,
      scaleY,
      isHighlighted: highlightIndices.includes(index)
    };
  });
}

/**
 * Applies a transform to an element using CSS transform property.
 * 
 * @deprecated Use applyInvertedTransforms instead which handles multiple elements
 * @param transform - The transform to apply
 * @param exaggerationFactor - Optional factor to exaggerate movement (default: 1)
 */
export function applyTransform(
  transform: ElementTransform,
  exaggerationFactor: number = 1
): void {
  const { element, translateX, translateY, scaleX, scaleY } = transform;
  
  // Optionally exaggerate the X translation for emphasis
  const exaggeratedX = translateX * exaggerationFactor;
  
  // Apply the transform
  element.style.transform = `
    translate(${exaggeratedX}px, ${translateY}px)
    scale(${scaleX}, ${scaleY})
  `;
  
  // Set transform origin to center
  element.style.transformOrigin = 'center';
  
  // Force a reflow to ensure the transform is applied immediately
  // eslint-disable-next-line no-unused-expressions
  element.offsetHeight;
}

/**
 * Records the current position and returns a function that calculates transforms.
 * 
 * @deprecated Use recordPositions instead which returns position data directly
 * @param elements - Array of HTML elements to capture
 * @returns A function that when called, calculates the transforms needed to return elements to their captured positions
 */
export function capturePositionAndGetTransformer(elements: HTMLElement[]): () => ElementTransform[] {
  const initialStates = recordPositions(elements);
  
  // Return a function that will calculate the transforms when called
  return () => calculateElementTransform(initialStates);
} 