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
 */

/**
 * Represents the captured state of an element
 */
export interface ElementState {
  /** The HTML element reference */
  element: HTMLElement;
  /** The element's bounding rectangle */
  rect: DOMRect;
  /** Left position relative to viewport */
  left: number;
  /** Top position relative to viewport */
  top: number;
  /** Element width */
  width: number;
  /** Element height */
  height: number;
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
 * Records the current position and returns a function that calculates transforms.
 * 
 * This is the original implementation, renamed to avoid conflict with the spec-compliant version.
 * 
 * @param elements - Array of HTML elements to capture
 * @returns A function that when called, calculates the transforms needed to return elements to their captured positions
 * @deprecated Use the new recordPositions function that returns position data directly
 */
export function capturePositionAndGetTransformer(elements: HTMLElement[]): () => ElementTransform[] {
  const initialStates = captureElementState(elements);
  
  // Return a function that will calculate the transforms when called
  return () => calculateElementTransform(initialStates);
}

/**
 * Position data structure as specified in the project requirements
 * Contains element reference and positional information
 */
export interface PositionData {
  /** The HTML element reference */
  elm: HTMLElement;
  /** Left position relative to viewport */
  left: number;
  /** Top position relative to viewport */
  top: number;
  /** Element width */
  width: number;
  /** Element height */
  height: number;
}

/**
 * Captures the current state of DOM elements for later comparison.
 * 
 * This is the "First" step in the FLIP technique, recording the initial position
 * before any DOM changes occur.
 * 
 * @param elements - Array of HTML elements to capture state for
 * @returns Array of captured element states
 */
export function captureElementState(elements: HTMLElement[]): ElementState[] {
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
 * Calculates the necessary transform to move elements from their current position
 * back to their original position.
 * 
 * This is used for the "Invert" step in the FLIP technique, where elements are
 * transformed to appear in their initial position after DOM changes.
 * 
 * @param initialStates - Element states captured before DOM changes
 * @param highlightIndices - Optional array of indices in the initialStates array to mark as highlighted
 * @returns Array of transform objects
 */
export function calculateElementTransform(
  initialStates: ElementState[],
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
 * Records the current position of all elements
 * Implements the function signature specified in the project requirements
 * 
 * @param elements - Array of HTML elements to capture position data for
 * @returns Array of position data objects with element references and their positions
 */
export function recordPositions(elements: HTMLElement[]): PositionData[] {
  return elements.map(elm => {
    const rect = elm.getBoundingClientRect();
    return {
      elm,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  });
}

/**
 * Apply inverted transforms to move elements back to their initial positions
 * Implements the function signature specified in the project requirements
 * 
 * @param positions - Array of position data captured before DOM changes
 * @param exaggerationFactor - Optional factor to exaggerate movement for visual effect (default: 1.0)
 */
export function applyInvertedTransforms(
  positions: PositionData[],
  exaggerationFactor: number = 1.0
): void {
  for (const position of positions) {
    const elm = position.elm;
    const newRect = elm.getBoundingClientRect();
    
    // Calculate the difference between old and new positions
    const deltaX = position.left - newRect.left;
    const deltaY = position.top - newRect.top;
    
    // Apply transform with optional exaggeration for horizontal movement
    if (deltaX !== 0) {
      const exaggeratedX = deltaX * exaggerationFactor;
      elm.style.transform = `translateX(${exaggeratedX}px)${deltaY !== 0 ? ` translateY(${deltaY}px)` : ''}`;
    } else if (deltaY !== 0) {
      elm.style.transform = `translateY(${deltaY}px)`;
    }
    
    // Ensure no transition is applied initially
    elm.style.transition = 'none';
    
    // Force reflow to ensure transforms are applied immediately
    // eslint-disable-next-line no-unused-expressions
    elm.offsetHeight;
  }
}

/**
 * Clear transforms after a reflow to allow animation to final positions
 * Implements the function signature specified in the project requirements
 * 
 * @param elements - Elements to clear transforms from
 * @param duration - Animation duration in seconds (default: 1.0)
 * @param easing - CSS easing function (default: cubic-bezier(0.25, 1, 0.5, 1))
 */
export function clearTransformsAfterReflow(
  elements: HTMLElement[],
  duration: number = 1.0,
  easing: string = 'cubic-bezier(0.25, 1, 0.5, 1)'
): void {
  // Force a reflow to ensure transforms are applied before animating them away
  // eslint-disable-next-line no-unused-expressions
  document.body.offsetHeight;
  
  // Apply transition and clear transforms
  elements.forEach(elm => {
    elm.style.transition = `transform ${duration}s ${easing}`;
    elm.style.transform = '';
  });
}

/**
 * Complete FLIP animation in one function call
 * This utility combines all FLIP steps into a single, easy-to-use function
 * 
 * @param elements - Elements to animate
 * @param reorderCallback - Function that performs the DOM reordering
 * @param exaggerationFactor - Factor to exaggerate movement (default: 1.5)
 * @param duration - Animation duration in seconds (default: 1.0)
 * @param easing - CSS easing function (default: cubic-bezier(0.25, 1, 0.5, 1))
 */
export function performFlipAnimation(
  elements: HTMLElement[],
  reorderCallback: () => void,
  exaggerationFactor: number = 1.5,
  duration: number = 1.0,
  easing: string = 'cubic-bezier(0.25, 1, 0.5, 1)'
): void {
  // First - record positions
  const initialPositions = recordPositions(elements);
  
  // Last - perform the reordering
  reorderCallback();
  
  // Invert - apply transforms to make it appear unchanged
  applyInvertedTransforms(initialPositions, exaggerationFactor);
  
  // Play - remove transforms to animate to final positions
  clearTransformsAfterReflow(elements, duration, easing);
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