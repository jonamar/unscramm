"use client";

import React, { useState, useRef } from "react";
import { InstallPrompt } from "../components/InstallPrompt";
import WordTransform from "../components/WordTransform";
import Controls from "../components/Controls";
import { WordTransformTestingAPI } from "../components/WordTransform";
import { WordPair } from "../services/wordPairService";
import { LocalWordPairService } from "../services/localWordPairService";
import Image from "next/image";

export default function Home() {
  // State for managing the current word pair
  const [currentWordPair, setCurrentWordPair] = useState<WordPair | undefined>();
  
  // State for animation controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isShuffleLoading, setIsShuffleLoading] = useState(false);
  const [shuffleError, setShuffleError] = useState<string | null>(null);
  
  // Reference to the WordTransform component for programmatic control
  const wordTransformRef = useRef<WordTransformTestingAPI>(null);
  
  // Create a local instance of the word pair service
  const wordPairService = new LocalWordPairService();

  // Handle play button click
  const handlePlay = () => {
    if (currentWordPair && wordTransformRef.current) {
      setIsPlaying(true);
      wordTransformRef.current.startAnimation();
    }
  };

  // Handle reset button click  
  const handleReset = () => {
    setIsPlaying(false);
    // WordTransform component will handle its own reset when props change
  };

  // Handle shuffle button click - load a random word pair when shuffle is toggled on
  const handleShuffle = async () => {
    const newShuffleState = !isShuffle;
    setIsShuffle(newShuffleState);
    
    // If turning shuffle on, load a random word pair
    if (newShuffleState) {
      setIsShuffleLoading(true);
      setShuffleError(null);
      
      try {
        const randomPair = await wordPairService.getRandomPair();
        setCurrentWordPair(randomPair);
        setIsPlaying(false); // Reset playing state when new words are loaded
        console.log('Shuffle successful:', randomPair);
      } catch (error) {
        console.error('Failed to load random word pair:', error);
        setShuffleError('Failed to load random word pair. Please try again.');
        
        // If shuffle fails, turn it back off
        setIsShuffle(false);
      } finally {
        setIsShuffleLoading(false);
      }
    } else {
      // Turning shuffle off - clear any error state
      setShuffleError(null);
    }
  };

  // Handle speed change
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  // Handle word pair submission from Controls
  const handleWordPairSubmit = (misspelling: string, correct: string) => {
    const newWordPair: WordPair = {
      misspelling,
      correct
    };
    setCurrentWordPair(newWordPair);
    setIsPlaying(false); // Reset playing state when new words are entered
  };

  // Handle animation completion
  const handleAnimationComplete = () => {
    setIsPlaying(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6">
      <InstallPrompt />
      <div className="max-w-3xl w-full">
        <header className="text-center mb-10">
          <Image 
            src="/unscramm-logo.svg" 
            alt="Unscramm Logo" 
            width={200} 
            height={60} 
            priority
            className="mx-auto mb-2"
          />
          <p className="text-xl text-gray-400">
            Visualize and correct spelling errors
          </p>
        </header>

        {/* WordTransform component container */}
        <div className="p-6 rounded-lg border border-gray-800 bg-gray-900 mb-8 min-h-28 flex items-center justify-center">
          {currentWordPair ? (
            <WordTransform
              ref={wordTransformRef}
              misspelling={currentWordPair.misspelling}
              correct={currentWordPair.correct}
              speedMultiplier={speed}
              onAnimationComplete={handleAnimationComplete}
              cancelOnPropsChange={true}
            />
          ) : (
            <p className="text-gray-400 text-center">
              Enter a word pair below to see the transformation animation
            </p>
          )}
        </div>

        {/* Controls component container */}
        <div className="p-6 rounded-lg border border-gray-800 bg-gray-900 mb-8">
          <Controls
            isPlaying={isPlaying}
            speed={speed}
            currentWordPair={currentWordPair}
            isShuffle={isShuffle}
            isShuffleLoading={isShuffleLoading}
            shuffleError={shuffleError}
            onPlay={handlePlay}
            onReset={handleReset}
            onSpeedChange={handleSpeedChange}
            onShuffle={handleShuffle}
            onWordPairSubmit={handleWordPairSubmit}
          />
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Phase 1 MVP - Interactive Animation</p>
        </div>
      </div>
    </main>
  );
}
