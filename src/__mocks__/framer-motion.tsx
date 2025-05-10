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
  layoutId?: string;
  custom?: unknown;
}

// Create combined types that merge MotionProps with HTML element props
type MotionDivProps = MotionProps & React.HTMLAttributes<HTMLDivElement>;
type MotionSpanProps = MotionProps & React.HTMLAttributes<HTMLSpanElement>;
type MotionSectionProps = MotionProps & React.HTMLAttributes<HTMLElement>;
type MotionArticleProps = MotionProps & React.HTMLAttributes<HTMLElement>;
type MotionAsideProps = MotionProps & React.HTMLAttributes<HTMLElement>;
type MotionUlProps = MotionProps & React.HTMLAttributes<HTMLUListElement>;
type MotionLiProps = MotionProps & React.HTMLAttributes<HTMLLIElement>;
type MotionButtonProps = MotionProps & React.HTMLAttributes<HTMLButtonElement>;
type MotionPProps = MotionProps & React.HTMLAttributes<HTMLParagraphElement>;
type MotionHeadingProps = MotionProps & React.HTMLAttributes<HTMLHeadingElement>;

// Mock for animation completion callbacks
export const mockAnimationComplete = jest.fn();

// Mock Framer Motion
const framerMotion = {
  motion: {
    div: (props: MotionDivProps) => <div {...props} />,
    span: (props: MotionSpanProps) => {
      // Call the animation complete callback directly for testing purposes
      // This simulates immediate completion of the animation in test environments
      if (props.onAnimationComplete) {
        // Call with setTimeout to avoid immediate execution in the render cycle
        setTimeout(() => {
          // Ensure callback is defined before calling
          if (props.onAnimationComplete) {
            props.onAnimationComplete();
          }
          
          // Also store for direct calls if needed
          mockAnimationComplete.mockImplementation(() => {
            if (props.onAnimationComplete) {
              props.onAnimationComplete();
            }
          });
        }, 0);
      }
      return <span {...props} />;
    },
    // Add other motion components as needed
    section: (props: MotionSectionProps) => <section {...props} />,
    article: (props: MotionArticleProps) => <article {...props} />,
    aside: (props: MotionAsideProps) => <aside {...props} />,
    ul: (props: MotionUlProps) => <ul {...props} />,
    li: (props: MotionLiProps) => <li {...props} />,
    button: (props: MotionButtonProps) => <button {...props} />,
    p: (props: MotionPProps) => <p {...props} />,
    h1: (props: MotionHeadingProps) => <h1 {...props} />,
    h2: (props: MotionHeadingProps) => <h2 {...props} />,
    h3: (props: MotionHeadingProps) => <h3 {...props} />,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAnimation: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
    mount: jest.fn(),
  })),
  Variants: jest.fn(),
  useMotionValue: jest.fn(() => ({
    set: jest.fn(),
    get: jest.fn(),
    onChange: jest.fn(),
  })),
  useTransform: jest.fn(() => ({
    set: jest.fn(),
    get: jest.fn(),
  })),
  usePresence: jest.fn(() => [true, jest.fn()]),
  useReducedMotion: jest.fn(() => false),
};

export default framerMotion; 