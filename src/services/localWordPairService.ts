import { WordPair, WordPairService } from './wordPairService';

/**
 * Structure of the word pairs JSON file
 */
interface WordPairData {
  metadata: {
    description: string;
    version: string;
    updated: string;
  };
  wordPairs: WordPair[];
}

/**
 * LocalWordPairService
 * Implements WordPairService using a local JSON dictionary of word pairs
 */
export class LocalWordPairService implements WordPairService {
  /**
   * Dictionary of word pairs loaded from JSON
   */
  private wordPairs: WordPair[] = [];

  /**
   * Recently used word pairs, newest first
   */
  private recentPairs: WordPair[] = [];

  /**
   * Path to the word pairs dictionary JSON file
   */
  private readonly dictionaryPath: string;

  /**
   * Maximum number of recent pairs to store
   */
  private readonly maxRecentPairs: number;

  /**
   * Last returned word pair to avoid consecutive repeats
   */
  private lastPair: WordPair | null = null;

  /**
   * Flag indicating if the dictionary has been loaded
   */
  private isDictionaryLoaded = false;

  /**
   * Creates a new LocalWordPairService
   * 
   * @param dictionaryPath - Path to the word pairs JSON file
   * @param maxRecentPairs - Maximum number of recent pairs to store
   */
  constructor(
    dictionaryPath: string = '/data/wordPairs.json', 
    maxRecentPairs: number = 10
  ) {
    this.dictionaryPath = dictionaryPath;
    this.maxRecentPairs = maxRecentPairs;
  }

  /**
   * Loads the word pair dictionary from the JSON file
   * @returns Promise resolving when the dictionary is loaded
   * @throws Error if the file couldn't be loaded or parsed
   */
  private async loadDictionary(): Promise<void> {
    if (this.isDictionaryLoaded && this.wordPairs.length > 0) {
      return; // Dictionary already loaded
    }

    try {
      // In a browser environment, we'd use fetch
      const response = await fetch(this.dictionaryPath);
      
      if (!response.ok) {
        throw new Error(`Failed to load word pairs dictionary: ${response.statusText}`);
      }
      
      const data: WordPairData = await response.json();
      
      if (!data.wordPairs || !Array.isArray(data.wordPairs)) {
        throw new Error('Invalid word pairs dictionary format');
      }
      
      // Validate that each entry has the required properties
      for (const pair of data.wordPairs) {
        if (!pair.misspelling || !pair.correct) {
          console.warn('Skipping invalid word pair:', pair);
          continue;
        }
        
        // Add unique IDs if not already present
        if (!pair.id) {
          pair.id = `${pair.misspelling}-${pair.correct}`;
        }
      }
      
      this.wordPairs = data.wordPairs;
      this.isDictionaryLoaded = true;
      
      // Perform initial shuffle
      this.shuffleDictionary();
      
    } catch (error) {
      console.error('Error loading word pairs dictionary:', error);
      // For resilience, provide a minimal fallback dictionary
      this.wordPairs = [
        { misspelling: 'teh', correct: 'the', id: 'fallback-1' },
        { misspelling: 'recieve', correct: 'receive', id: 'fallback-2' },
        { misspelling: 'wierd', correct: 'weird', id: 'fallback-3' }
      ];
      this.isDictionaryLoaded = true;
      // Don't throw the error here, just use fallback dictionary
    }
  }

  /**
   * Shuffles the dictionary to ensure randomness
   */
  private shuffleDictionary(): void {
    // Fisher-Yates shuffle algorithm
    for (let i = this.wordPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.wordPairs[i], this.wordPairs[j]] = [this.wordPairs[j], this.wordPairs[i]];
    }
  }

  /**
   * Returns a random word pair from the dictionary
   * @returns Promise resolving to a random WordPair
   * @throws Error if no word pairs are available
   */
  async getRandomPair(): Promise<WordPair> {
    // Ensure dictionary is loaded
    if (!this.isDictionaryLoaded) {
      await this.loadDictionary();
    }

    if (this.wordPairs.length === 0) {
      throw new Error('No word pairs available');
    }

    if (this.wordPairs.length === 1) {
      // Only one pair available, just return it
      const pair = this.wordPairs[0];
      await this.storeRecentPair(pair);
      this.lastPair = pair;
      return pair;
    }

    // Try to find a pair different from the last one
    let attempts = 0;
    let pair: WordPair;
    
    do {
      // If we've attempted more than half the dictionary size,
      // just shuffle the dictionary and pick the first one
      if (attempts > this.wordPairs.length / 2) {
        this.shuffleDictionary();
        pair = this.wordPairs[0];
        break;
      }
      
      const randomIndex = Math.floor(Math.random() * this.wordPairs.length);
      pair = this.wordPairs[randomIndex];
      attempts++;
    } while (
      this.lastPair && 
      pair.id === this.lastPair.id && 
      this.wordPairs.length > 1
    );

    // Store the pair as recently used
    await this.storeRecentPair(pair);
    this.lastPair = pair;
    return pair;
  }

  /**
   * Validates whether a given word pair is considered valid
   * 
   * @param misspelling - The misspelled version of the word
   * @param correct - The correct spelling of the word
   * @returns Promise resolving to a boolean indicating validity
   */
  async validateWordPair(misspelling: string, correct: string): Promise<boolean> {
    // Placeholder implementation
    // Will be fully implemented in task 3.5
    return misspelling !== correct && misspelling.length > 0 && correct.length > 0;
  }

  /**
   * Stores a word pair in the recent history
   * 
   * @param pair - The WordPair to store
   * @returns Promise resolving when the pair has been stored
   */
  async storeRecentPair(pair: WordPair): Promise<void> {
    // Ensure the pair has an ID
    const pairToStore: WordPair = {
      ...pair,
      id: pair.id || `${pair.misspelling}-${pair.correct}`
    };
    
    // Check if this pair is already in recent history
    const existingIndex = this.recentPairs.findIndex(p => p.id === pairToStore.id);
    
    // If it exists, remove it from its current position
    if (existingIndex !== -1) {
      this.recentPairs.splice(existingIndex, 1);
    }
    
    // Add to the front of the recent pairs
    this.recentPairs.unshift(pairToStore);
    
    // Trim the recent pairs list if it exceeds the maximum
    if (this.recentPairs.length > this.maxRecentPairs) {
      this.recentPairs = this.recentPairs.slice(0, this.maxRecentPairs);
    }
  }

  /**
   * Returns the most recently used word pairs
   * 
   * @param count - Optional number of pairs to return (defaults to all)
   * @returns Promise resolving to an array of WordPairs
   */
  async getRecentPairs(count?: number): Promise<WordPair[]> {
    const limit = count ? Math.min(count, this.recentPairs.length) : this.recentPairs.length;
    return this.recentPairs.slice(0, limit);
  }
  
  /**
   * Clears the recent pairs history
   */
  async clearRecentPairs(): Promise<void> {
    this.recentPairs = [];
  }
} 