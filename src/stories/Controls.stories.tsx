import React, { useState, useRef } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import Controls from '../components/Controls';
import WordTransform, { WordTransformTestingAPI } from '../components/WordTransform';
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

// Story specifically for testing empty phase transitions
export const EmptyPhaseTransitionTest: Story = {
  render: () => <EmptyPhaseTestControls />,
};

// Comprehensive test for consecutive empty phases
export const ConsecutiveEmptyPhasesTest: Story = {
  render: () => {
    const ConsecutiveEmptyPhasesTest = React.lazy(() => import('./ConsecutiveEmptyPhasesTest'));
    return (
      <React.Suspense fallback={<div style={{ color: '#fff', padding: '2rem' }}>Loading test suite...</div>}>
        <ConsecutiveEmptyPhasesTest />
      </React.Suspense>
    );
  },
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
  
  // Reference to the WordTransform component for programmatic control
  const wordTransformRef = useRef<WordTransformTestingAPI>(null);

  const handlePlay = () => {
    if (currentWordPair && wordTransformRef.current) {
      setIsPlaying(true);
      wordTransformRef.current.startAnimation();
    }
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
    setIsPlaying(false);
  };

  // Handle animation completion
  const handleAnimationComplete = () => {
    setIsPlaying(false);
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '900px' }}>
      <div style={{ marginBottom: '1rem', color: '#888', fontSize: '0.9rem' }}>
        <strong>🧪 Real Shuffle Test:</strong> This story uses the actual LocalWordPairService 
        to test shuffle functionality. Click the shuffle button to load real word pairs from the dictionary.
      </div>
      
      {/* WordTransform component container - matches main app styling */}
      <div style={{ 
        padding: '1.5rem', 
        borderRadius: '8px', 
        border: '1px solid #374151', 
        backgroundColor: '#111827', 
        marginBottom: '1.5rem',
        minHeight: '7rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {currentWordPair ? (
          <WordTransform
            ref={wordTransformRef}
            misspelling={currentWordPair.misspelling}
            correct={currentWordPair.correct}
            speedMultiplier={speed}
            onAnimationComplete={handleAnimationComplete}
          />
        ) : (
          <p style={{ color: '#9CA3AF', textAlign: 'center', margin: 0 }}>
            Click shuffle or enter a word pair below to see the transformation animation
          </p>
        )}
      </div>
      
      {/* Controls component container */}
      <div style={{ 
        padding: '1.5rem', 
        borderRadius: '8px', 
        border: '1px solid #374151', 
        backgroundColor: '#111827',
        marginBottom: '1.5rem'
      }}>
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
      </div>
      
      {shuffleHistory.length > 0 && (
        <div style={{ marginTop: '1rem', color: '#888' }}>
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

// Component for testing empty phase transitions
const EmptyPhaseTestControls = () => {
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordPair, setCurrentWordPair] = useState<WordPair | undefined>();
  const [testHistory, setTestHistory] = useState<{ pair: WordPair; description: string }[]>([]);
  
  const wordTransformRef = useRef<WordTransformTestingAPI>(null);

  // Test cases that trigger different empty phase scenarios
  const testCases = [
    { misspelling: "cat", correct: "cats", description: "No deletions, no moves (only insertions)" },
    { misspelling: "hello", correct: "helo", description: "No insertions, no moves (only deletions)" },
    { misspelling: "abc", correct: "abd", description: "No deletions, no moves (only character changes)" },
    { misspelling: "same", correct: "same", description: "Identical words (all phases empty)" },
    { misspelling: "a", correct: "b", description: "Single letter replacement" },
    { misspelling: "test", correct: "tests", description: "No deletions, no moves - consecutive empty phases" },
    { misspelling: "word", correct: "wor", description: "No moves, no insertions - consecutive empty phases" },
    { misspelling: "ab", correct: "cd", description: "Only character replacements - no moves or insertions" },
  ];

  const handlePlay = () => {
    if (currentWordPair && wordTransformRef.current) {
      setIsPlaying(true);
      wordTransformRef.current.startAnimation();
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const handleTestCase = (testCase: typeof testCases[0]) => {
    const newPair = {
      id: Date.now().toString(),
      misspelling: testCase.misspelling,
      correct: testCase.correct,
    };
    
    setCurrentWordPair(newPair);
    setTestHistory(prev => [...prev, { pair: newPair, description: testCase.description }]);
    setIsPlaying(false);
  };

  const handleWordPairSubmit = (misspelling: string, correct: string) => {
    const newPair = {
      id: Date.now().toString(),
      misspelling,
      correct,
    };
    
    setCurrentWordPair(newPair);
    setIsPlaying(false);
  };

  const handleAnimationComplete = () => {
    setIsPlaying(false);
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '900px' }}>
      <div style={{ marginBottom: '1rem', color: '#888', fontSize: '0.9rem' }}>
        <strong>🧪 Empty Phase Transition Test:</strong> This story tests word pairs that trigger empty animation phases 
        to verify the fix for animation freezing issues.
      </div>
      
      {/* WordTransform component container */}
      <div style={{ 
        padding: '1.5rem', 
        borderRadius: '8px', 
        border: '1px solid #374151', 
        backgroundColor: '#111827', 
        marginBottom: '1.5rem',
        minHeight: '7rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {currentWordPair ? (
          <WordTransform
            ref={wordTransformRef}
            misspelling={currentWordPair.misspelling}
            correct={currentWordPair.correct}
            speedMultiplier={speed}
            onAnimationComplete={handleAnimationComplete}
            debugMode={true}
          />
        ) : (
          <p style={{ color: '#9CA3AF', textAlign: 'center', margin: 0 }}>
            Select a test case below to see the transformation animation
          </p>
        )}
      </div>
      
      {/* Controls component container */}
      <div style={{ 
        padding: '1.5rem', 
        borderRadius: '8px', 
        border: '1px solid #374151', 
        backgroundColor: '#111827',
        marginBottom: '1.5rem'
      }}>
        <Controls
          speed={speed}
          isPlaying={isPlaying}
          isShuffle={false}
          currentWordPair={currentWordPair}
          onPlay={handlePlay}
          onReset={handleReset}
          onSpeedChange={handleSpeedChange}
          onWordPairSubmit={handleWordPairSubmit}
        />
      </div>
      
      {/* Test Cases - moved below UI */}
      <div style={{ 
        padding: '1.5rem', 
        borderRadius: '8px', 
        border: '1px solid #374151', 
        backgroundColor: '#111827',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Empty Phase Test Cases</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {testCases.map((testCase, index) => (
            <button
              key={index}
              onClick={() => handleTestCase(testCase)}
              style={{
                padding: '0.75rem',
                backgroundColor: '#374151',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.9rem'
              }}
            >
              <strong>&quot;{testCase.misspelling}&quot; → &quot;{testCase.correct}&quot;</strong>
              <br />
              <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{testCase.description}</span>
            </button>
          ))}
        </div>
      </div>
      
      {testHistory.length > 0 && (
        <div style={{ marginTop: '1rem', color: '#888' }}>
          <h3>Test History:</h3>
          <ul>
            {testHistory.map((test, index) => (
              <li key={`${test.pair.id}-${index}`} style={{ marginBottom: '0.5rem' }}>
                <strong>{test.pair.misspelling} → {test.pair.correct}</strong>
                <br />
                <span style={{ fontSize: '0.8rem', color: '#666' }}>{test.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={{ marginTop: '1rem', color: '#666', fontSize: '0.8rem' }}>
        Note: Watch the debug info in the WordTransform component to see phase transitions.
        The animation should complete smoothly for all test cases without freezing.
      </div>
    </div>
  );
}; 