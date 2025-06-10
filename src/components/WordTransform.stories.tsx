import type { Meta, StoryObj } from '@storybook/react';
import WordTransform from './WordTransform';

const meta: Meta<typeof WordTransform> = {
  title: 'Components/WordTransform',
  component: WordTransform,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    misspelling: { control: 'text' },
    correct: { control: 'text' },
    speedMultiplier: { control: { type: 'range', min: 0.5, max: 3, step: 0.1 } },
    colorsEnabled: { control: 'boolean' },
    debugMode: { control: 'boolean' },
    cancelOnPropsChange: { control: 'boolean' },
    onAnimationStart: { action: 'animation started' },
    onAnimationComplete: { action: 'animation completed' },
    onPhaseChange: { action: 'phase changed' },
  },
};

export default meta;
type Story = StoryObj<typeof WordTransform>;

export const Default: Story = {
  args: {
    misspelling: 'teh',
    correct: 'the',
    speedMultiplier: 1,
    colorsEnabled: true,
    debugMode: false,
    cancelOnPropsChange: true,
  },
};

export const WithDebugMode: Story = {
  args: {
    misspelling: 'teh',
    correct: 'the',
    speedMultiplier: 1,
    colorsEnabled: true,
    debugMode: true,
    cancelOnPropsChange: true,
  },
};

export const LongerWords: Story = {
  args: {
    misspelling: 'recieve',
    correct: 'receive',
    speedMultiplier: 1,
    colorsEnabled: true,
    debugMode: false,
    cancelOnPropsChange: true,
  },
};

export const FastAnimation: Story = {
  args: {
    misspelling: 'teh',
    correct: 'the',
    speedMultiplier: 3,
    colorsEnabled: true,
    debugMode: false,
    cancelOnPropsChange: true,
  },
};

export const SlowAnimation: Story = {
  args: {
    misspelling: 'teh',
    correct: 'the',
    speedMultiplier: 0.5,
    colorsEnabled: true,
    debugMode: false,
    cancelOnPropsChange: true,
  },
};

export const NoColors: Story = {
  args: {
    misspelling: 'teh',
    correct: 'the',
    speedMultiplier: 1,
    colorsEnabled: false,
    debugMode: false,
    cancelOnPropsChange: true,
  },
};

export const MoreComplexTransformation: Story = {
  args: {
    misspelling: 'hello',
    correct: 'hillo',
    speedMultiplier: 1,
    colorsEnabled: true,
    debugMode: true,
    cancelOnPropsChange: true,
  },
};

export const WithRestartFunctionality: Story = {
  args: {
    misspelling: 'cofee',
    correct: 'coffee',
    speedMultiplier: 1,
    colorsEnabled: true,
    debugMode: true,
    cancelOnPropsChange: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'This example demonstrates the restart functionality. After the animation completes, a "Replay" button appears that allows restarting the animation. You can also press the "r" key to restart when the animation is complete.',
      },
    },
  },
};

// Special cases for different animation phases
export const DeletionsOnly: Story = {
  args: {
    misspelling: 'apple',
    correct: 'ape',
    speedMultiplier: 1,
    colorsEnabled: true,
    debugMode: true,
    cancelOnPropsChange: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'This example demonstrates a transformation that only involves deletions. The "pl" is removed from "apple" to make "ape".',
      },
    },
  },
};

export const InsertionsOnly: Story = {
  args: {
    misspelling: 'cat',
    correct: 'chart',
    speedMultiplier: 1,
    colorsEnabled: true,
    debugMode: true,
    cancelOnPropsChange: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'This example demonstrates a transformation that only involves insertions. The letters "h", "r" are inserted into "cat" to make "chart".',
      },
    },
  },
};

export const MovementsOnly: Story = {
  args: {
    misspelling: 'bag',
    correct: 'gab',
    speedMultiplier: 1,
    colorsEnabled: true,
    debugMode: true,
    cancelOnPropsChange: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'This example demonstrates a transformation that only involves letter movements, with "bag" rearranged to "gab".',
      },
    },
  },
};

export const AllOperationsCombined: Story = {
  args: {
    misspelling: 'cofee',
    correct: 'office',
    speedMultiplier: 1,
    colorsEnabled: true,
    debugMode: true,
    cancelOnPropsChange: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'This example combines all operations: deletion, insertion, and movement, transforming "cofee" to "office".',
      },
    },
  },
};

export const ZeroLengthPhases: Story = {
  args: {
    misspelling: 'hello',
    correct: 'hello',
    speedMultiplier: 1,
    colorsEnabled: true,
    debugMode: true,
    cancelOnPropsChange: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'This example demonstrates the behavior when no transformations are needed (identical words). The state machine should skip unnecessary phases.',
      },
    },
  },
};

export const EdgeCaseEmptyToFull: Story = {
  args: {
    misspelling: '',
    correct: 'word',
    speedMultiplier: 1,
    colorsEnabled: true,
    debugMode: true,
    cancelOnPropsChange: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case showing transformation from an empty string to a word. This should only involve insertion animations.',
      },
    },
  },
};

export const EdgeCaseFullToEmpty: Story = {
  args: {
    misspelling: 'word',
    correct: '',
    speedMultiplier: 1,
    colorsEnabled: true,
    debugMode: true,
    cancelOnPropsChange: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case showing transformation from a word to an empty string. This should only involve deletion animations.',
      },
    },
  },
}; 