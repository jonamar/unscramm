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
 * The normal state represents a character in its default state (white).
 */
export const Normal: Story = {
  args: {
    character: 'A',
    animationState: 'normal',
    tabIndex: 0,
  },
};

/**
 * The insertion state represents a character being added (green).
 */
export const Insertion: Story = {
  args: {
    character: 'B',
    animationState: 'insertion',
    tabIndex: 0,
  },
};

/**
 * The deletion state represents a character being removed (red).
 * Note: Tab index is automatically set to -1 in this state.
 */
export const Deletion: Story = {
  args: {
    character: 'C',
    animationState: 'deletion',
    tabIndex: 0,
  },
};

/**
 * The movement state represents a character changing position (yellow).
 */
export const Movement: Story = {
  args: {
    character: 'D',
    animationState: 'movement',
    tabIndex: 0,
  },
};

/**
 * Example showing all animation states side by side.
 */
export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Letter character="N" animationState="normal" />
      <Letter character="I" animationState="insertion" />
      <Letter character="D" animationState="deletion" />
      <Letter character="M" animationState="movement" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'This story shows all four animation states side by side for comparison.',
      },
    },
  },
};

/**
 * Example showing letter with layout animation disabled.
 */
export const DisabledLayoutAnimation: Story = {
  args: {
    character: 'X',
    animationState: 'normal',
    disableLayoutAnimation: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'This story demonstrates a letter with layout animations disabled for performance optimization.',
      },
    },
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
 * Example showing keyboard focus state.
 */
export const WithKeyboardFocus: Story = {
  args: {
    character: 'F',
    animationState: 'normal',
    tabIndex: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'This shows the letter with keyboard focus. In a real application, you can tab to this element.',
      },
    },
    pseudo: { focus: true },
  },
};

/**
 * Demonstrates accessibility features with annotations.
 */
export const AccessibilityFeatures: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <strong>ARIA Attributes:</strong>
        <ul style={{ textAlign: 'left', marginBottom: '1rem' }}>
          <li>role="text"</li>
          <li>aria-label="Letter X" (changes with state)</li>
          <li>aria-live="polite" (for state changes)</li>
          <li>aria-atomic="true"</li>
          <li>aria-relevant="text"</li>
          <li>aria-hidden="true" (only in deletion state)</li>
        </ul>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div>
          <p>Normal:</p>
          <Letter character="A" animationState="normal" />
        </div>
        <div>
          <p>Deletion:</p>
          <Letter character="B" animationState="deletion" />
        </div>
        <div>
          <p>Insertion:</p>
          <Letter character="C" animationState="insertion" />
        </div>
        <div>
          <p>Movement:</p>
          <Letter character="D" animationState="movement" />
        </div>
      </div>
    </div>
  ),
}; 