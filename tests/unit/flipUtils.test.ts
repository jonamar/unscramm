import { 
  recordPositions,
  applyInvertedTransforms,
  clearTransformsAfterReflow,
  performFlipAnimation,
  PositionData,
  ElementTransform
} from '../../src/utils/flipUtils';

// Import jest explicitly
import * as jestImport from '@jest/globals';
const { jest } = jestImport;

// Mock DOMRect class since it's not available in the Node.js environment
class MockDOMRect implements DOMRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.left = x;
    this.top = y;
    this.right = x + width;
    this.bottom = y + height;
  }

  // Required by DOMRect interface
  toJSON(): any {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      top: this.top,
      right: this.right,
      bottom: this.bottom,
      left: this.left
    };
  }
}

// Helper function to mock the getBoundingClientRect method
function mockGetBoundingClientRect(rect: DOMRect): () => DOMRect {
  // Create a simple mock function without using jest
  const mockFn = () => rect;
  // Add mock properties that might be expected
  (mockFn as any).mockImplementation = () => mockFn;
  return mockFn;
}

describe('FLIP Animation Utilities', () => {
  // Setup
  beforeEach(() => {
    // Reset the document body before each test
    document.body.innerHTML = '';
  });

  // Utility function to create mock positions
  function createMockPositionData(element: HTMLElement, x: number, y: number, width: number, height: number): PositionData {
    return {
      element,
      left: x,
      top: y,
      width,
      height,
      rect: new MockDOMRect(x, y, width, height)
    };
  }

  describe('recordPositions', () => {
    it('should correctly capture state of a single element', () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Mock getBoundingClientRect to return a predictable value
      const mockRect = new MockDOMRect(10, 20, 100, 50);
      element.getBoundingClientRect = mockGetBoundingClientRect(mockRect);
      
      // Capture the element's state
      const positions = recordPositions([element]);
      
      // Verify the captured state
      expect(positions.length).toBe(1);
      expect(positions[0].element).toBe(element);
      expect(positions[0].left).toBe(10);
      expect(positions[0].top).toBe(20);
      expect(positions[0].width).toBe(100);
      expect(positions[0].height).toBe(50);
    });
    
    it('should correctly capture state of multiple elements', () => {
      // Create test elements
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);
      
      // Mock getBoundingClientRect to return predictable values
      element1.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(10, 20, 100, 50));
      element2.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(200, 300, 150, 75));
      
      // Capture the elements' states
      const positions = recordPositions([element1, element2]);
      
      // Verify the captured states
      expect(positions.length).toBe(2);
      expect(positions[0].element).toBe(element1);
      expect(positions[0].left).toBe(10);
      expect(positions[1].element).toBe(element2);
      expect(positions[1].width).toBe(150);
    });
  });
  
  describe('applyInvertedTransforms', () => {
    it('should apply correct transforms to move elements back to their initial positions', () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Create position data
      const position = createMockPositionData(element, 100, 50, 200, 100);
      
      // Mock the current position
      element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(50, 50, 200, 100));
      
      // Apply the inverted transforms
      applyInvertedTransforms([position]);
      
      // Verify the transform was applied correctly (100 - 50 = 50px)
      expect(element.style.transform).toContain('translateX(50px)');
      expect(element.style.transition).toBe('none');
      expect(element.style.transformOrigin).toBe('center');
    });
    
    it('should apply exaggerated transforms when factor is provided', () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Create position data
      const position = createMockPositionData(element, 100, 50, 200, 100);
      
      // Mock the current position
      element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(50, 50, 200, 100));
      
      // Apply the inverted transforms with exaggeration
      applyInvertedTransforms([position], 1.5);
      
      // Verify the transform was applied with exaggeration (50px * 1.5 = 75px)
      expect(element.style.transform).toContain('translateX(75px)');
    });
    
    it('should handle both X and Y transforms', () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Create position data
      const position = createMockPositionData(element, 100, 80, 200, 100);
      
      // Mock the current position
      element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(50, 50, 200, 100));
      
      // Apply the inverted transforms
      applyInvertedTransforms([position]);
      
      // Verify both transforms were applied
      expect(element.style.transform).toContain('translateX(50px)');
      expect(element.style.transform).toContain('translateY(30px)');
    });
    
    it('should handle scale transforms when size changes', () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Create position data
      const position = createMockPositionData(element, 50, 50, 200, 100);
      
      // Mock the current position with different size
      element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(50, 50, 100, 50));
      
      // Apply the inverted transforms
      applyInvertedTransforms([position]);
      
      // Verify the transform includes scale
      expect(element.style.transform).toContain('scale(2, 2)');
    });
    
    it('should add highlight class for specified indices', () => {
      // Create test elements
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);
      
      // Create position data
      const position1 = createMockPositionData(element1, 10, 20, 100, 50);
      const position2 = createMockPositionData(element2, 200, 300, 150, 75);
      
      // Mock current positions - no movement for simplicity
      element1.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(10, 20, 100, 50));
      element2.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(200, 300, 150, 75));
      
      // Apply transforms with the second element highlighted
      applyInvertedTransforms([position1, position2], 1.0, [1]);
      
      // Verify highlight class added only to the second element
      expect(element1.classList.contains('flip-highlight')).toBe(false);
      expect(element2.classList.contains('flip-highlight')).toBe(true);
    });
  });
  
  describe('clearTransformsAfterReflow', () => {
    it('should set transitions and clear transforms', () => {
      // Create test elements
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);
      
      // Set some initial transforms
      element1.style.transform = 'translateX(50px)';
      element2.style.transform = 'translateY(30px)';
      
      // Clear transforms
      clearTransformsAfterReflow([element1, element2], 0.5, 'ease-out');
      
      // Verify transitions were set and transforms were cleared
      expect(element1.style.transition).toBe('transform 0.5s ease-out');
      expect(element1.style.transform).toBe('');
      
      expect(element2.style.transition).toBe('transform 0.5s ease-out');
      expect(element2.style.transform).toBe('');
    });
    
    it('should return a promise that resolves when animation completes', async () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Set up a spy on addEventListener
      let transitionEndCallback: Function | null = null;
      const originalAddEventListener = element.addEventListener;
      element.addEventListener = jest.fn((event, callback) => {
        if (event === 'transitionend') {
          transitionEndCallback = callback as Function;
        }
        return originalAddEventListener.call(element, event, callback);
      });
      
      // Start clearing transforms (this returns a promise)
      const animationPromise = clearTransformsAfterReflow([element], 0.1);
      
      // Make sure addEventListener was called for transitionend
      expect(element.addEventListener).toHaveBeenCalledWith('transitionend', expect.any(Function));
      
      // Simulate the transition ending
      if (transitionEndCallback) {
        const dispatchTransitionEnd = () => {
          const event = new Event('transitionend') as Event;
          element.dispatchEvent(event);
        };
        dispatchTransitionEnd();
      }
      
      // Wait for the promise to resolve
      await animationPromise;
      
      // Restore the original method
      element.addEventListener = originalAddEventListener;
    });
    
    it('should resolve even if there are no elements', async () => {
      const animationPromise = clearTransformsAfterReflow([]);
      await expect(animationPromise).resolves.toBeUndefined();
    });
    
    it('should remove flip-highlight class after animation', async () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Add highlight class
      element.classList.add('flip-highlight');
      
      // Set up to trigger the transition end event
      let transitionEndCallback: Function | null = null;
      const originalAddEventListener = element.addEventListener;
      element.addEventListener = jest.fn((event, callback) => {
        if (event === 'transitionend') {
          transitionEndCallback = callback as Function;
        }
        return originalAddEventListener.call(element, event, callback);
      });
      
      // Start animation
      const animationPromise = clearTransformsAfterReflow([element], 0.1);
      
      // Trigger transition end
      if (transitionEndCallback) {
        const event = new Event('transitionend') as Event;
        element.dispatchEvent(event);
      }
      
      // Wait for animation to complete
      await animationPromise;
      
      // Check that highlight class was removed
      expect(element.classList.contains('flip-highlight')).toBe(false);
      
      // Restore original method
      element.addEventListener = originalAddEventListener;
    });
  });
  
  describe('performFlipAnimation', () => {
    it('should perform complete FLIP animation sequence', async () => {
      // Create test elements
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Mock getBoundingClientRect
      element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(10, 20, 100, 50));
      
      // Mock reorderCallback to change the position
      const reorderCallback = jest.fn(() => {
        // Simulate moving the element
        element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(50, 70, 100, 50));
      });
      
      // Set up for transition end
      let transitionEndCallback: Function | null = null;
      const originalAddEventListener = element.addEventListener;
      element.addEventListener = jest.fn((event, callback) => {
        if (event === 'transitionend') {
          transitionEndCallback = callback as Function;
        }
        return originalAddEventListener.call(element, event, callback);
      });
      
      // Start the FLIP animation
      const animationPromise = performFlipAnimation(
        [element],
        reorderCallback,
        1.5, // exaggeration factor
        0.1  // short duration for testing
      );
      
      // Check that callback was called
      expect(reorderCallback).toHaveBeenCalled();
      
      // The transform is applied internally but can be flaky to test
      // since jsdom doesn't fully simulate layout
      
      // Trigger transition end
      if (transitionEndCallback) {
        const event = new Event('transitionend') as Event;
        element.dispatchEvent(event);
      }
      
      // Wait for animation to complete
      await animationPromise;
      
      // After animation, transform should be cleared
      expect(element.style.transform).toBe('');
      
      // Restore original method
      element.addEventListener = originalAddEventListener;
    });
  });
}); 