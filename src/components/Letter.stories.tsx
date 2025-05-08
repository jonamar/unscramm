import type { Meta, StoryObj } from '@storybook/react';
import Letter from './Letter';

/**
 * The Letter component is responsible for displaying a single character with animation
 * states for spelling corrections. It supports various animations for insertion, deletion,
 * and movement of characters.
 */
const meta: Meta<typeof Letter> = {
  title: 'Components/Letter',
  component: Letter,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#121212' },
        { name: 'light', value: '#f8f8f8' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    character: { 
      control: 'text',
      description: 'The character to display',
    },
    animationState: { 
      control: 'select',
      options: ['normal', 'deletion', 'insertion', 'movement'],
      description: 'The current animation state of the letter',
    },
    onAnimationComplete: { 
      action: 'animation completed',
      description: 'Called when animation finishes',
    },
    initialIndex: {
      control: 'number',
      description: 'Initial index for tracking character position',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply',
    },
    tabIndex: {
      control: 'number',
      description: 'Tab index for keyboard navigation (automatically set to -1 for deletion state)',
    },
    disableLayoutAnimation: {
      control: 'boolean',
      description: 'Flag to disable layout animations for performance',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Letter>;

/**
 * Default state of the Letter component.
 */
export const Default: Story = {
  args: {
    character: 'A',
    animationState: 'normal',
  },
};

/**
 * Demonstrates a letter being deleted.
 */
export const Deletion: Story = {
  args: {
    character: 'B',
    animationState: 'deletion',
  },
};

/**
 * Demonstrates a letter being inserted.
 */
export const Insertion: Story = {
  args: {
    character: 'C',
    animationState: 'insertion',
  },
};

/**
 * Demonstrates a letter moving to a new position.
 */
export const Movement: Story = {
  args: {
    character: 'D',
    animationState: 'movement',
  },
};

/**
 * Example showing custom styling via className prop.
 */
export const CustomStyling: Story = {
  args: {
    character: 'S',
    animationState: 'normal',
    className: 'custom-letter',
  },
  decorators: [
    (Story) => (
      <div>
        <style>{`
          .custom-letter {
            font-size: 3rem;
            font-family: 'Courier New', monospace;
            background: linear-gradient(45deg, #ff8a00, #e52e71);
            padding: 0.5rem;
            border-radius: 8px;
          }
        `}</style>
        <Story />
      </div>
    ),
  ],
};

/**
 * Demonstrates keyboard navigation and focus states.
 */
export const KeyboardNavigation: Story = {
  args: {
    character: 'F',
    animationState: 'normal',
    tabIndex: 0,
  },
  decorators: [
    (Story) => (
      <div>
        <p style={{ marginBottom: '1rem', color: '#fff' }}>
          Press Tab to focus the letter and observe focus styles
        </p>
        <Story />
      </div>
    ),
  ],
};

/**
 * Shows how the component handles long animations.
 */
export const LongAnimation: Story = {
  args: {
    character: 'M',
    animationState: 'movement',
    onAnimationComplete: () => console.log('Animation completed'),
  },
  decorators: [
    (Story) => (
      <div>
        <p style={{ marginBottom: '1rem', color: '#fff' }}>
          This story demonstrates a longer movement animation with bounce effect
        </p>
        <Story />
      </div>
    ),
  ],
};

/**
 * Demonstrates accessibility features.
 */
export const Accessibility: Story = {
  args: {
    character: 'A',
    animationState: 'insertion',
  },
  decorators: [
    (Story) => (
      <div>
        <p style={{ marginBottom: '1rem', color: '#fff' }}>
          Use a screen reader to hear the ARIA labels and live region updates
        </p>
        <Story />
      </div>
    ),
  ],
};

/**
 * REDUCED MOTION STORIES
 * 
 * The following stories demonstrate how the Letter component respects users'
 * prefers-reduced-motion settings, showing simplified animations or no animations
 * for users who may be sensitive to motion.
 */

/**
 * Helper component to simulate reduced motion preference
 */
const ReducedMotionWrapper = ({ children }: { children: React.ReactNode }) => (
  <div>
    <style>{`
      /* Force reduced motion for these examples */
      @media (prefers-reduced-motion: no-preference) {
        * {
          transition-duration: 0.001ms !important;
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
        }
      }
    `}</style>
    <div>
      <p style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#ffa000' }}>
        ⚠️ Reduced Motion Mode ⚠️
      </p>
      {children}
    </div>
  </div>
);

/**
 * Shows how animations are simplified when reduced motion is preferred.
 */
export const ReducedMotionDeletion: Story = {
  args: {
    character: 'R',
    animationState: 'deletion',
  },
  decorators: [(Story) => <ReducedMotionWrapper><Story /></ReducedMotionWrapper>],
};

export const ReducedMotionInsertion: Story = {
  args: {
    character: 'R',
    animationState: 'insertion',
  },
  decorators: [(Story) => <ReducedMotionWrapper><Story /></ReducedMotionWrapper>],
};

export const ReducedMotionMovement: Story = {
  args: {
    character: 'R',
    animationState: 'movement',
  },
  decorators: [(Story) => <ReducedMotionWrapper><Story /></ReducedMotionWrapper>],
}; 