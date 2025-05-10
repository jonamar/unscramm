import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import Controls from '../components/Controls';
import { WordPair } from '../services/wordPairService';

const meta: Meta<typeof Controls> = {
  title: 'Components/Controls',
  component: Controls,
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
};

export default meta;

type Story = StoryObj<typeof Controls>;

export const Default: Story = {
  args: {
    speed: 1,
    isPlaying: false,
    isShuffle: false,
  },
};

export const WithWordPair: Story = {
  args: {
    speed: 1,
    isPlaying: false,
    isShuffle: false,
    currentWordPair: {
      id: '1',
      misspelling: 'recieve',
      correct: 'receive',
    },
  },
};

export const Playing: Story = {
  args: {
    speed: 1,
    isPlaying: true,
    isShuffle: false,
    currentWordPair: {
      id: '1',
      misspelling: 'recieve',
      correct: 'receive',
    },
  },
};

export const ShuffleEnabled: Story = {
  args: {
    speed: 1,
    isPlaying: false,
    isShuffle: true,
    currentWordPair: {
      id: '1',
      misspelling: 'recieve',
      correct: 'receive',
    },
  },
};

export const FastSpeed: Story = {
  args: {
    speed: 2,
    isPlaying: false,
    isShuffle: false,
    currentWordPair: {
      id: '1',
      misspelling: 'recieve',
      correct: 'receive',
    },
  },
};

export const SlowSpeed: Story = {
  args: {
    speed: 0.5,
    isPlaying: false,
    isShuffle: false,
    currentWordPair: {
      id: '1',
      misspelling: 'recieve',
      correct: 'receive',
    },
  },
};

// Interactive story
export const Interactive: Story = {
  render: () => <InteractiveControls />,
};

// Interactive controls with stateful behavior
const InteractiveControls = () => {
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [currentWordPair, setCurrentWordPair] = useState<WordPair>({
    id: '1',
    misspelling: 'recieve',
    correct: 'receive',
  });
  const [wordPairHistory, setWordPairHistory] = useState<WordPair[]>([]);

  const handlePlay = () => {
    setIsPlaying(true);
    
    // Simulate animation ending after 3 seconds
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
  };

  const handleReset = () => {
    setIsPlaying(false);
  };

  const handleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const handleWordPairSubmit = (misspelling: string, correct: string) => {
    const newPair = {
      id: Date.now().toString(),
      misspelling,
      correct,
    };
    
    setCurrentWordPair(newPair);
    setWordPairHistory(prev => [...prev, newPair]);
    
    // Auto-play the animation when a new word pair is submitted
    handlePlay();
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '800px' }}>
      <Controls
        speed={speed}
        isPlaying={isPlaying}
        isShuffle={isShuffle}
        currentWordPair={currentWordPair}
        onPlay={handlePlay}
        onReset={handleReset}
        onShuffle={handleShuffle}
        onSpeedChange={handleSpeedChange}
        onWordPairSubmit={handleWordPairSubmit}
      />
      
      {wordPairHistory.length > 0 && (
        <div style={{ marginTop: '2rem', color: '#888' }}>
          <h3>Word Pair History:</h3>
          <ul>
            {wordPairHistory.map((pair, index) => (
              <li key={pair.id}>
                {index + 1}. {pair.misspelling} → {pair.correct}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 