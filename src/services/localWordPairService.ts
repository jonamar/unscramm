import { WordPair, WordPairService } from './wordPairService';

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
   */
  private async loadDictionary(): Promise<void> {
    // Placeholder for dictionary loading logic
    // Will be implemented in task 3.4
    this.wordPairs = [];
  }

  /**
   * Returns a random word pair from the dictionary
   * @returns Promise resolving to a random WordPair
   */
  async getRandomPair(): Promise<WordPair> {
    // Placeholder implementation
    // Will be fully implemented in task 3.4
    return {
      misspelling: 'placeholder',
      correct: 'placeholder'
    };
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
    // Placeholder implementation
    // Will be fully implemented in task 3.5
    this.recentPairs.unshift(pair);
    
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
    // Placeholder implementation
    // Will be fully implemented in task 3.4
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