import type { Meta, StoryObj } from '@storybook/react';
import WordTransformFSM from './WordTransformFSM';

const meta: Meta<typeof WordTransformFSM> = {
  title: 'Components/WordTransformFSM',
  component: WordTransformFSM,
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
type Story = StoryObj<typeof WordTransformFSM>;

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