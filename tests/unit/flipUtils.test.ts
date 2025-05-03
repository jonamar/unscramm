import { 
  recordPositions,
  applyInvertedTransforms,
  clearTransformsAfterReflow,
  performFlipAnimation,
  calculateElementTransform,
  applyTransform,
  isSignificantTransform,
  capturePositionAndGetTransformer,
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
    
    it('should use default values when not specified', () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Set some initial transform
      element.style.transform = 'translateX(50px)';
      
      // Clear transforms with default values
      clearTransformsAfterReflow([element]);
      
      // Verify default values were used
      expect(element.style.transition).toBe('transform 1s cubic-bezier(0.25, 1, 0.5, 1)');
      expect(element.style.transform).toBe('');
    });
    
    it('should return a promise that resolves after animation', async () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Mock the transitionend event
      const dispatchTransitionEnd = () => {
        element.dispatchEvent(new Event('transitionend'));
      };
      
      // Start the animation and store the promise
      const animationPromise = clearTransformsAfterReflow([element], 0.1);
      
      // Simulate the animation ending
      setTimeout(dispatchTransitionEnd, 20);
      
      // Wait for the promise to resolve
      await animationPromise;
      
      // If we got here, the promise resolved successfully
      expect(true).toBe(true);
    });
  });
  
  describe('performFlipAnimation', () => {
    it('should orchestrate the complete FLIP animation sequence', () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Initial mock position
      element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(10, 20, 100, 50));
      
      // Create a reordering callback that changes the position
      const reorderCallback = jest.fn(() => {
        // Update the mock to return a new position after reordering
        element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(100, 20, 100, 50));
      });
      
      // Perform the FLIP animation
      performFlipAnimation([element], reorderCallback);
      
      // Verify the reorder callback was called
      expect(reorderCallback).toHaveBeenCalled();
      
      // Verify the transform was cleared and transition was set
      expect(element.style.transform).toBe('');
      expect(element.style.transition).toBe('transform 1s cubic-bezier(0.25, 1, 0.5, 1)');
    });
    
    it('should use custom duration, exaggeration, and easing when provided', () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Initial mock position
      element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(10, 20, 100, 50));
      
      // Create a reordering callback
      const reorderCallback = jest.fn(() => {
        element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(100, 20, 100, 50));
      });
      
      // Perform the FLIP animation with custom parameters
      performFlipAnimation(
        [element], 
        reorderCallback, 
        2.0,  // exaggeration factor
        0.75, // duration
        'ease-in-out' // easing
      );
      
      // Verify custom values were used
      expect(element.style.transition).toBe('transform 0.75s ease-in-out');
    });
    
    it('should apply highlight to specified indices', () => {
      // Create test elements
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);
      
      // Initial mock positions
      element1.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(10, 20, 100, 50));
      element2.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(120, 20, 100, 50));
      
      // Create a reordering callback
      const reorderCallback = jest.fn(() => {
        // Swap positions
        element1.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(120, 20, 100, 50));
        element2.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(10, 20, 100, 50));
      });
      
      // Perform animation with element2 highlighted
      performFlipAnimation(
        [element1, element2], 
        reorderCallback,
        1.5,
        1.0,
        'cubic-bezier(0.25, 1, 0.5, 1)',
        [1] // Highlight the second element
      );
      
      // Verify highlight class added to element2 only
      expect(element1.classList.contains('flip-highlight')).toBe(false);
      expect(element2.classList.contains('flip-highlight')).toBe(true);
    });
  });
  
  describe('isSignificantTransform', () => {
    it('should return true for significant position changes', () => {
      const transform: ElementTransform = {
        element: document.createElement('div'),
        translateX: 5,
        translateY: 0,
        scaleX: 1,
        scaleY: 1
      };
      
      expect(isSignificantTransform(transform, 1)).toBe(true);
    });
    
    it('should return false for insignificant position changes', () => {
      const transform: ElementTransform = {
        element: document.createElement('div'),
        translateX: 0.1,
        translateY: 0.2,
        scaleX: 1,
        scaleY: 1
      };
      
      expect(isSignificantTransform(transform, 1)).toBe(false);
    });
    
    it('should return true for significant scale changes', () => {
      const transform: ElementTransform = {
        element: document.createElement('div'),
        translateX: 0,
        translateY: 0,
        scaleX: 1.5,
        scaleY: 1
      };
      
      expect(isSignificantTransform(transform, 1)).toBe(true);
    });
  });
  
  // Tests for deprecated functions
  describe('deprecated functions', () => {
    describe('calculateElementTransform', () => {
      it('should calculate correct transform when element position changes', () => {
        // Create a test element
        const element = document.createElement('div');
        document.body.appendChild(element);
        
        // Create initial state with mock data
        const initialState: PositionData = createMockPositionData(element, 10, 20, 100, 50);
        
        // Mock the current position (after DOM changes)
        element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(30, 40, 100, 50));
        
        // Calculate the transform
        const transforms = calculateElementTransform([initialState]);
        
        // Verify the transform
        expect(transforms.length).toBe(1);
        expect(transforms[0].element).toBe(element);
        expect(transforms[0].translateX).toBe(-20); // 10 - 30 = -20
        expect(transforms[0].translateY).toBe(-20); // 20 - 40 = -20
        expect(transforms[0].scaleX).toBe(1); // No size change
        expect(transforms[0].scaleY).toBe(1); // No size change
      });
      
      it('should mark elements as highlighted based on highlightIndices', () => {
        // Create test elements
        const element1 = document.createElement('div');
        const element2 = document.createElement('div');
        document.body.appendChild(element1);
        document.body.appendChild(element2);
        
        // Create initial states
        const initialStates: PositionData[] = [
          createMockPositionData(element1, 10, 20, 100, 50),
          createMockPositionData(element2, 200, 300, 150, 75)
        ];
        
        // Mock current positions
        element1.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(10, 20, 100, 50));
        element2.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(200, 300, 150, 75));
        
        // Calculate transforms with element2 highlighted
        const transforms = calculateElementTransform(initialStates, [1]);
        
        // Verify highlight flags
        expect(transforms[0].isHighlighted).toBeFalsy();
        expect(transforms[1].isHighlighted).toBe(true);
      });
    });
    
    describe('applyTransform', () => {
      it('should apply the correct transform to the element', () => {
        // Create a test element
        const element = document.createElement('div');
        document.body.appendChild(element);
        
        // Create a transform
        const transform: ElementTransform = {
          element,
          translateX: 10,
          translateY: 20,
          scaleX: 1.5,
          scaleY: 0.8
        };
        
        // Apply the transform
        applyTransform(transform);
        
        // Verify the transform was applied correctly
        expect(element.style.transform).toContain('translate(10px, 20px)');
        expect(element.style.transform).toContain('scale(1.5, 0.8)');
        expect(element.style.transformOrigin).toBe('center');
      });
      
      it('should apply exaggerated transform when factor is provided', () => {
        // Create a test element
        const element = document.createElement('div');
        document.body.appendChild(element);
        
        // Create a transform
        const transform: ElementTransform = {
          element,
          translateX: 10,
          translateY: 20,
          scaleX: 1,
          scaleY: 1
        };
        
        // Apply the transform with exaggeration
        applyTransform(transform, 1.5);
        
        // Verify the transform was applied with exaggeration
        expect(element.style.transform).toContain('translate(15px, 20px)');
      });
    });
    
    describe('capturePositionAndGetTransformer', () => {
      it('should return a function that calculates transforms', () => {
        // Create a test element
        const element = document.createElement('div');
        document.body.appendChild(element);
        
        // Mock initial position
        element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(10, 20, 100, 50));
        
        // Record the initial positions
        const getTransforms = capturePositionAndGetTransformer([element]);
        
        // Change the element's position
        element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(30, 40, 100, 50));
        
        // Get the transforms
        const transforms = getTransforms();
        
        // Verify the transforms
        expect(transforms.length).toBe(1);
        expect(transforms[0].translateX).toBe(-20);
        expect(transforms[0].translateY).toBe(-20);
      });
    });
  });
}); 