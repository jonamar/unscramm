import React from 'react';
import { jest } from '@jest/globals';

// Define type for common motion component props
interface MotionProps {
  animate?: Record<string, unknown>;
  initial?: Record<string, unknown>;
  exit?: Record<string, unknown>;
  variants?: Record<string, unknown>;
  onAnimationComplete?: (definition?: string) => void;
  transition?: Record<string, unknown>;
  layout?: boolean | string;
}

// Create combined types that merge MotionProps with HTML element props
type MotionDivProps = MotionProps & React.HTMLAttributes<HTMLDivElement>;
type MotionSpanProps = MotionProps & React.HTMLAttributes<HTMLSpanElement>;

// Mock Framer Motion - simplified to only include what's actually used
const framerMotion = {
  motion: {
    div: (props: MotionDivProps) => <div {...props} />,
    span: (props: MotionSpanProps) => {
      // Call the animation complete callback directly for testing purposes
      if (props.onAnimationComplete) {
        // Call with setTimeout to avoid immediate execution in the render cycle
        setTimeout(() => {
          if (props.onAnimationComplete) {
            props.onAnimationComplete();
          }
        }, 0);
      }
      return <span {...props} />;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePresence: jest.fn(() => [true, jest.fn()]),
  useReducedMotion: jest.fn(() => false),
};

export default framerMotion; 