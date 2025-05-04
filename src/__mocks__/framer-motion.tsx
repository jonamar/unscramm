import React from 'react';
import { jest } from '@jest/globals';

// Mock for animation completion callbacks
export const mockAnimationComplete = jest.fn();

// Mock Framer Motion
const framerMotion = {
  motion: {
    div: (props: any) => <div {...props} />,
    span: (props: any) => {
      // Call the animation complete callback directly for testing purposes
      // This simulates immediate completion of the animation in test environments
      if (props.onAnimationComplete) {
        // Call with setTimeout to avoid immediate execution in the render cycle
        setTimeout(() => {
          props.onAnimationComplete();
          // Also store for direct calls if needed
          mockAnimationComplete.mockImplementation(props.onAnimationComplete);
        }, 0);
      }
      return <span {...props} />;
    },
    // Add other motion components as needed
    section: (props: any) => <section {...props} />,
    article: (props: any) => <article {...props} />,
    aside: (props: any) => <aside {...props} />,
    ul: (props: any) => <ul {...props} />,
    li: (props: any) => <li {...props} />,
    button: (props: any) => <button {...props} />,
    p: (props: any) => <p {...props} />,
    h1: (props: any) => <h1 {...props} />,
    h2: (props: any) => <h2 {...props} />,
    h3: (props: any) => <h3 {...props} />,
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
};

export default framerMotion; 