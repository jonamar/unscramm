import React, { useState, useRef } from 'react';
import WordTransform, { WordTransformTestingAPI } from '../components/WordTransform';
import { computeEditPlan } from '../utils/editPlan';

interface TestCase {
  misspelling: string;
  correct: string;
  description: string;
  expectedPhases: string[];
}

const ConsecutiveEmptyPhasesTest: React.FC = () => {
  const [currentTest, setCurrentTest] = useState<TestCase | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [phaseLog, setPhaseLog] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{ case: TestCase; phases: string[]; success: boolean }[]>([]);
  
  const wordTransformRef = useRef<WordTransformTestingAPI>(null);
  
  // Comprehensive test cases that should trigger consecutive empty phases
  const testCases: TestCase[] = [
    {
      misspelling: "cat",
      correct: "cats",
      description: "No deletions, no moves (deleting→moving both empty, only inserting has operations)",
      expectedPhases: ['idle', 'inserting', 'complete']
    },
    {
      misspelling: "hello",
      correct: "helo", 
      description: "No moves, no insertions (moving→inserting both empty, only deleting has operations)",
      expectedPhases: ['idle', 'deleting', 'complete']
    },
    {
      misspelling: "same",
      correct: "same",
      description: "Identical words (all phases empty)",
      expectedPhases: ['idle', 'complete']
    },
    {
      misspelling: "test",
      correct: "tests",
      description: "Appending characters (deleting→moving both empty)",
      expectedPhases: ['idle', 'inserting', 'complete']  
    },
    {
      misspelling: "word",
      correct: "wor",
      description: "Removing characters (moving→inserting both empty)",
      expectedPhases: ['idle', 'deleting', 'complete']
    },
    {
      misspelling: "ab",
      correct: "ba",
      description: "Pure character swapping (should have moves)",
      expectedPhases: ['idle', 'moving', 'complete']
    }
  ];

  const analyzeEditPlan = (misspelling: string, correct: string) => {
    const editPlan = computeEditPlan(misspelling, correct);
    return {
      deletions: editPlan?.deletions.length || 0,
      moves: editPlan?.moves.length || 0,
      insertions: editPlan?.insertions.length || 0,
      editPlan
    };
  };

  const runTest = (testCase: TestCase) => {
    setCurrentTest(testCase);
    setPhaseLog(['idle']);
    setIsRunning(true);
    
    // Reset the WordTransform component when starting a new test
    if (wordTransformRef.current) {
      wordTransformRef.current.reset();
    }
    
    // Analyze the edit plan to understand what should happen
    const analysis = analyzeEditPlan(testCase.misspelling, testCase.correct);
    console.log(`Testing: "${testCase.misspelling}" → "${testCase.correct}"`, analysis);
  };

  const handlePhaseChange = (phase: string) => {
    setPhaseLog(prev => {
      const newLog = [...prev, phase];
      console.log(`Phase transition: ${newLog.join(' → ')}`);
      return newLog;
    });
  };

  const handleAnimationComplete = () => {
    setIsRunning(false);
    
    if (currentTest) {
      const success = phaseLog.length > 0 && phaseLog[phaseLog.length - 1] === 'complete';
      setTestResults(prev => [...prev, {
        case: currentTest,
        phases: phaseLog,
        success
      }]);
    }
  };

  const startAnimation = () => {
    if (wordTransformRef.current) {
      wordTransformRef.current.startAnimation();
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setPhaseLog([]);
    setCurrentTest(null);
    setIsRunning(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', fontFamily: 'monospace' }}>
      <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Consecutive Empty Phases Test Suite</h2>
      
      <div style={{ marginBottom: '2rem', color: '#ccc' }}>
        <p>This test verifies that the WordTransform component correctly handles consecutive empty phases without freezing.</p>
      </div>

      {/* Current Test Display */}
      <div style={{ 
        padding: '1.5rem', 
        borderRadius: '8px', 
        border: '1px solid #374151', 
        backgroundColor: '#111827',
        marginBottom: '1.5rem',
        minHeight: '8rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {currentTest ? (
          <>
            <WordTransform
              ref={wordTransformRef}
              misspelling={currentTest.misspelling}
              correct={currentTest.correct}
              speedMultiplier={0.5} // Slower for easier observation
              onPhaseChange={handlePhaseChange}
              onAnimationComplete={handleAnimationComplete}
              debugMode={true}
            />
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <p style={{ color: '#fff', margin: '0.5rem 0' }}>
                <strong>Testing:</strong> &quot;{currentTest.misspelling}&quot; → &quot;{currentTest.correct}&quot;
              </p>
              <p style={{ color: '#ccc', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                {currentTest.description}
              </p>
              <button 
                onClick={startAnimation}
                disabled={isRunning}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: isRunning ? '#666' : '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isRunning ? 'not-allowed' : 'pointer'
                }}
              >
                {isRunning ? 'Running...' : 'Start Animation'}
              </button>
              
              {phaseLog.length > 1 && (
                <p style={{ color: '#34d399', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                  <strong>Phase Log:</strong> {phaseLog.join(' → ')}
                </p>
              )}
            </div>
          </>
        ) : (
          <p style={{ color: '#9CA3AF', textAlign: 'center' }}>
            Select a test case below to begin testing
          </p>
        )}
      </div>

      {/* Test Cases */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Test Cases</h3>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {testCases.map((testCase, index) => {
            const analysis = analyzeEditPlan(testCase.misspelling, testCase.correct);
            return (
              <button
                key={index}
                onClick={() => runTest(testCase)}
                style={{
                  padding: '1rem',
                  backgroundColor: '#374151',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.9rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <strong>&quot;{testCase.misspelling}&quot; → &quot;{testCase.correct}&quot;</strong>
                    <br />
                    <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{testCase.description}</span>
                    <br />
                    <span style={{ color: '#34d399', fontSize: '0.8rem' }}>
                      Expected: {testCase.expectedPhases.join(' → ')}
                    </span>
                  </div>
                  <div style={{ marginLeft: '1rem', fontSize: '0.8rem', color: '#60a5fa' }}>
                    D:{analysis.deletions} M:{analysis.moves} I:{analysis.insertions}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#fff', margin: 0 }}>Test Results</h3>
            <button 
              onClick={clearResults}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear Results
            </button>
          </div>
          
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {testResults.map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  backgroundColor: result.success ? '#064e3b' : '#7f1d1d',
                  border: `1px solid ${result.success ? '#059669' : '#dc2626'}`,
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>&quot;{result.case.misspelling}&quot; → &quot;{result.case.correct}&quot;</strong>
                    <br />
                    <span style={{ color: '#ccc' }}>
                      Actual: {result.phases.join(' → ')}
                    </span>
                    <br />
                    <span style={{ color: '#ccc' }}>
                      Expected: {result.case.expectedPhases.join(' → ')}
                    </span>
                  </div>
                  <div style={{ 
                    color: result.success ? '#34d399' : '#f87171',
                    fontWeight: 'bold'
                  }}>
                    {result.success ? '✅ PASS' : '❌ FAIL'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsecutiveEmptyPhasesTest; 