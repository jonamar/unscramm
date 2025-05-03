import { 
  captureElementState, 
  calculateElementTransform, 
  applyTransform,
  recordPositions,
  isSignificantTransform,
  ElementState,
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

  describe('captureElementState', () => {
    it('should correctly capture state of a single element', () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Mock getBoundingClientRect to return a predictable value
      const mockRect = new MockDOMRect(10, 20, 100, 50);
      element.getBoundingClientRect = mockGetBoundingClientRect(mockRect);
      
      // Capture the element's state
      const states = captureElementState([element]);
      
      // Verify the captured state
      expect(states.length).toBe(1);
      expect(states[0].element).toBe(element);
      expect(states[0].left).toBe(10);
      expect(states[0].top).toBe(20);
      expect(states[0].width).toBe(100);
      expect(states[0].height).toBe(50);
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
      const states = captureElementState([element1, element2]);
      
      // Verify the captured states
      expect(states.length).toBe(2);
      expect(states[0].element).toBe(element1);
      expect(states[0].left).toBe(10);
      expect(states[1].element).toBe(element2);
      expect(states[1].width).toBe(150);
    });
  });
  
  describe('calculateElementTransform', () => {
    it('should calculate correct transform when element position changes', () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Create initial state with mock data
      const initialState: ElementState = {
        element,
        rect: new MockDOMRect(10, 20, 100, 50),
        left: 10,
        top: 20,
        width: 100,
        height: 50
      };
      
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
    
    it('should calculate correct transform when element size changes', () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Create initial state with mock data
      const initialState: ElementState = {
        element,
        rect: new MockDOMRect(10, 20, 100, 50),
        left: 10,
        top: 20,
        width: 100,
        height: 50
      };
      
      // Mock the current position with different size
      element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(10, 20, 200, 100));
      
      // Calculate the transform
      const transforms = calculateElementTransform([initialState]);
      
      // Verify the transform
      expect(transforms[0].translateX).toBe(0); // No position change
      expect(transforms[0].translateY).toBe(0); // No position change
      expect(transforms[0].scaleX).toBe(0.5); // 100 / 200 = 0.5
      expect(transforms[0].scaleY).toBe(0.5); // 50 / 100 = 0.5
    });
    
    it('should mark elements as highlighted based on highlightIndices', () => {
      // Create test elements
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      document.body.appendChild(element1);
      document.body.appendChild(element2);
      
      // Create initial states
      const initialStates: ElementState[] = [
        {
          element: element1,
          rect: new MockDOMRect(10, 20, 100, 50),
          left: 10,
          top: 20,
          width: 100,
          height: 50
        },
        {
          element: element2,
          rect: new MockDOMRect(200, 300, 150, 75),
          left: 200,
          top: 300,
          width: 150,
          height: 75
        }
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

    it('should handle zero dimensions gracefully', () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Create initial state with mock data
      const initialState: ElementState = {
        element,
        rect: new MockDOMRect(10, 20, 100, 50),
        left: 10,
        top: 20,
        width: 100,
        height: 50
      };
      
      // Mock the current position with zero width
      element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(10, 20, 0, 50));
      
      // Calculate the transform
      const transforms = calculateElementTransform([initialState]);
      
      // Verify the transform handles zero width
      expect(transforms[0].scaleX).toBe(100); // Should not cause division by zero
      expect(transforms[0].scaleY).toBe(1);
    });
  });
  
  describe('recordPositions', () => {
    it('should return a function that calculates transforms', () => {
      // Create a test element
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Mock initial position
      element.getBoundingClientRect = mockGetBoundingClientRect(new MockDOMRect(10, 20, 100, 50));
      
      // Record the initial positions
      const getTransforms = recordPositions([element]);
      
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
}); 