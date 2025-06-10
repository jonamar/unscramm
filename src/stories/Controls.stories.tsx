import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import Controls from '../components/Controls';
import { WordPair } from '../services/wordPairService';
import { LocalWordPairService } from '../services/localWordPairService';

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

// Interactive story with REAL shuffle functionality
export const WithRealShuffle: Story = {
  render: () => <RealShuffleControls />,
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

// Controls with REAL LocalWordPairService for testing actual shuffle functionality
const RealShuffleControls = () => {
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isShuffleLoading, setIsShuffleLoading] = useState(false);
  const [shuffleError, setShuffleError] = useState<string | null>(null);
  const [currentWordPair, setCurrentWordPair] = useState<WordPair | undefined>();
  const [shuffleHistory, setShuffleHistory] = useState<WordPair[]>([]);
  
  // Create a real instance of the word pair service
  const wordPairService = new LocalWordPairService();

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

  // REAL shuffle functionality using LocalWordPairService
  const handleShuffle = async () => {
    const newShuffleState = !isShuffle;
    setIsShuffle(newShuffleState);
    
    if (newShuffleState) {
      setIsShuffleLoading(true);
      setShuffleError(null);
      
      try {
        const randomPair = await wordPairService.getRandomPair();
        setCurrentWordPair(randomPair);
        setShuffleHistory(prev => [...prev, randomPair]);
        setIsPlaying(false);
        console.log('Storybook shuffle successful:', randomPair);
      } catch (error) {
        console.error('Storybook shuffle failed:', error);
        setShuffleError('Failed to load random word pair. Please try again.');
        setIsShuffle(false);
      } finally {
        setIsShuffleLoading(false);
      }
    } else {
      setShuffleError(null);
    }
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
    handlePlay();
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '800px' }}>
      <div style={{ marginBottom: '1rem', color: '#888', fontSize: '0.9rem' }}>
        <strong>🧪 Real Shuffle Test:</strong> This story uses the actual LocalWordPairService 
        to test shuffle functionality. Click the shuffle button to load real word pairs from the dictionary.
      </div>
      
      <Controls
        speed={speed}
        isPlaying={isPlaying}
        isShuffle={isShuffle}
        isShuffleLoading={isShuffleLoading}
        shuffleError={shuffleError}
        currentWordPair={currentWordPair}
        onPlay={handlePlay}
        onReset={handleReset}
        onShuffle={handleShuffle}
        onSpeedChange={handleSpeedChange}
        onWordPairSubmit={handleWordPairSubmit}
      />
      
      {shuffleHistory.length > 0 && (
        <div style={{ marginTop: '2rem', color: '#888' }}>
          <h3>Shuffle History (from real dictionary):</h3>
          <ul>
            {shuffleHistory.map((pair, index) => (
              <li key={`${pair.id}-${index}`}>
                {index + 1}. {pair.misspelling} → {pair.correct}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={{ marginTop: '1rem', color: '#666', fontSize: '0.8rem' }}>
        Open browser console to see detailed logging from LocalWordPairService
      </div>
    </div>
  );
}; 