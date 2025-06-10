import { WordPair, WordPairService } from './wordPairService';

/**
 * Custom error classes for the WordPairService
 */
export class WordPairServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WordPairServiceError';
  }
}

export class InvalidInputError extends WordPairServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}

export class DictionaryError extends WordPairServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'DictionaryError';
  }
}

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
   * Maximum allowed word length
   */
  private readonly MAX_WORD_LENGTH = 100;

  /**
   * Creates a new LocalWordPairService
   * 
   * @param dictionaryPath - Path to the word pairs JSON file
   * @param maxRecentPairs - Maximum number of recent pairs to store
   * @throws {InvalidInputError} If parameters are invalid
   */
  constructor(
    dictionaryPath: string = '/data/wordPairs.json', 
    maxRecentPairs: number = 10
  ) {
    // Validate constructor parameters
    if (!dictionaryPath || typeof dictionaryPath !== 'string') {
      throw new InvalidInputError('Dictionary path must be a non-empty string');
    }
    
    if (typeof maxRecentPairs !== 'number' || maxRecentPairs < 0 || !Number.isInteger(maxRecentPairs)) {
      throw new InvalidInputError('Maximum recent pairs must be a non-negative integer');
    }
    
    this.dictionaryPath = dictionaryPath;
    this.maxRecentPairs = maxRecentPairs;
  }

  /**
   * Fetches and parses the word pairs dictionary from the specified path
   * 
   * @returns Promise resolving to the parsed dictionary data
   * @throws {DictionaryError} If fetch fails or response is not OK
   */
  private async fetchDictionary(): Promise<WordPairData> {
    try {
      const response = await fetch(this.dictionaryPath);
      
      if (!response.ok) {
        throw new DictionaryError(`Failed to load word pairs dictionary: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof DictionaryError) {
        throw error;
      }
      
      if (error instanceof SyntaxError) {
        throw new DictionaryError(`Failed to parse word pairs dictionary JSON: ${error.message}`);
      }
      
      throw new DictionaryError(`Failed to fetch dictionary: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validates word pairs from the dictionary and adds IDs if needed
   * 
   * @param wordPairs - Array of word pairs to validate
   * @returns Array of valid word pairs with IDs
   */
  private validateWordPairs(wordPairs: WordPair[]): WordPair[] {
    if (!wordPairs || !Array.isArray(wordPairs)) {
      throw new DictionaryError('Invalid word pairs dictionary format: missing or invalid wordPairs array');
    }
    
    const validPairs: WordPair[] = [];
    
    for (const pair of wordPairs) {
      if (!pair.misspelling || !pair.correct || 
          typeof pair.misspelling !== 'string' || 
          typeof pair.correct !== 'string') {
        console.warn('Skipping invalid word pair:', pair);
        continue;
      }
      
      // Add unique IDs if not already present
      const pairWithId: WordPair = {
        ...pair,
        id: pair.id || `${pair.misspelling}-${pair.correct}`
      };
      
      validPairs.push(pairWithId);
    }
    
    if (validPairs.length === 0) {
      throw new DictionaryError('No valid word pairs found in dictionary');
    }
    
    return validPairs;
  }

  /**
   * Creates a fallback dictionary with basic word pairs
   * 
   * @returns Array of basic word pairs to use as fallback
   */
  private createFallbackDictionary(): WordPair[] {
    console.warn('Using fallback dictionary due to loading error');
    return [
      { misspelling: 'teh', correct: 'the', id: 'fallback-1' },
      { misspelling: 'recieve', correct: 'receive', id: 'fallback-2' },
      { misspelling: 'wierd', correct: 'weird', id: 'fallback-3' }
    ];
  }

  /**
   * Loads the word pair dictionary from the JSON file
   * @returns Promise resolving when the dictionary is loaded
   * @throws {DictionaryError} If the file couldn't be loaded or parsed
   */
  private async loadDictionary(): Promise<void> {
    // Early return if dictionary is already loaded
    if (this.isDictionaryLoaded && this.wordPairs.length > 0) {
      return;
    }

    try {
      // Fetch and parse the dictionary
      const data = await this.fetchDictionary();
      
      // Validate word pairs and add IDs
      this.wordPairs = this.validateWordPairs(data.wordPairs);
      this.isDictionaryLoaded = true;
      
      // Perform initial shuffle
      this.shuffleDictionary();
      
    } catch (error) {
      console.error('Error loading word pairs dictionary:', error);
      
      // For resilience, provide a minimal fallback dictionary
      this.wordPairs = this.createFallbackDictionary();
      this.isDictionaryLoaded = true;
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
   * Validates a string input against common requirements
   * 
   * @param input - The string to validate
   * @param fieldName - Name of the field for error messages
   * @param maxLength - Optional maximum length (defaults to MAX_WORD_LENGTH)
   * @throws {InvalidInputError} If the input is invalid
   */
  private validateStringInput(input: unknown, fieldName: string, maxLength?: number): void {
    const max = maxLength || this.MAX_WORD_LENGTH;
    
    if (input === null || input === undefined) {
      throw new InvalidInputError(`${fieldName} cannot be null or undefined`);
    }
    
    if (typeof input !== 'string') {
      throw new InvalidInputError(`${fieldName} must be a string`);
    }
    
    if (input.trim().length === 0) {
      throw new InvalidInputError(`${fieldName} cannot be empty`);
    }
    
    if (input.length > max) {
      throw new InvalidInputError(`${fieldName} exceeds maximum length of ${max} characters`);
    }
  }

  /**
   * Selects a random word pair that differs from the last returned pair
   * 
   * @returns A randomly selected word pair
   * @throws {DictionaryError} If no word pairs are available
   */
  private selectRandomPair(): WordPair {
    if (this.wordPairs.length === 0) {
      throw new DictionaryError('No word pairs available');
    }

    if (this.wordPairs.length === 1) {
      // Only one pair available, just return it
      return this.wordPairs[0];
    }

    // Try to find a pair different from the last one
    let attempts = 0;
    let pair: WordPair;
    
    do {
      // If we've attempted more than half the dictionary size,
      // just shuffle the dictionary and pick the first one
      if (attempts > this.wordPairs.length / 2) {
        this.shuffleDictionary();
        return this.wordPairs[0];
      }
      
      const randomIndex = Math.floor(Math.random() * this.wordPairs.length);
      pair = this.wordPairs[randomIndex];
      attempts++;
    } while (
      this.lastPair && 
      pair.id === this.lastPair.id && 
      this.wordPairs.length > 1
    );

    return pair;
  }

  /**
   * Gets a random word pair from the dictionary
   * Ensures the pair is not the same as the last returned pair
   * @returns Promise<WordPair> A random word pair
   * @throws {DictionaryError} If the dictionary fails to load
   */
  async getRandomPair(): Promise<WordPair> {
    try {
      // Load dictionary if not already loaded
      await this.loadDictionary();
      
      // Shuffle the dictionary array for better randomness
      this.shuffleDictionary();
      
      // Select a random pair (avoiding immediate repeats)
      const selectedPair = this.selectRandomPair();
      
      // Store the pair in recent history
      await this.storeRecentPair(selectedPair);
      
      // Update last pair to avoid consecutive duplicates
      this.lastPair = selectedPair;
      
      return selectedPair;
    } catch (error) {
      console.error('Error in getRandomPair:', error);
      throw error;
    }
  }

  /**
   * Validates whether a given word pair is considered valid
   * 
   * @param misspelling - The misspelled version of the word
   * @param correct - The correct spelling of the word
   * @returns Promise resolving to a boolean indicating validity
   * @throws {InvalidInputError} If inputs are invalid
   */
  async validateWordPair(misspelling: string, correct: string): Promise<boolean> {
    try {
      // Validate inputs
      this.validateStringInput(misspelling, 'Misspelled word');
      this.validateStringInput(correct, 'Correct word');
      
      // Basic validation: words must be different
      if (misspelling.trim().toLowerCase() === correct.trim().toLowerCase()) {
        return false; // Words are the same (ignoring case and whitespace)
      }
      
      // Ensure the dictionary is loaded
      if (!this.isDictionaryLoaded) {
        await this.loadDictionary();
      }
      
      // Check if misspelling is actually misspelled (exists in our dictionary)
      const misspellingLower = misspelling.trim().toLowerCase();
      const correctLower = correct.trim().toLowerCase();
      
      // Check if this exact pair exists in our dictionary
      const existsInDictionary = this.wordPairs.some(pair => 
        pair.misspelling.toLowerCase() === misspellingLower && 
        pair.correct.toLowerCase() === correctLower
      );
      
      // Additional validation criteria
      const reasonableLength = misspelling.length > 1 && correct.length > 1;
      const notTooSimilar = calculateSimilarity(misspellingLower, correctLower) < 0.9;
      
      // A word pair is valid if:
      // 1. It exists in our dictionary, OR
      // 2. Both words are of reasonable length AND they're not too similar
      //    (to prevent slight typos being treated as valid pairs)
      return existsInDictionary || (reasonableLength && notTooSimilar);
    } catch (error) {
      // Rethrow if it's already one of our custom errors
      if (error instanceof WordPairServiceError) {
        throw error;
      }
      // Otherwise wrap it
      throw new InvalidInputError(`Error validating word pair: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Stores a word pair in the recent history
   * 
   * @param pair - The WordPair to store
   * @returns Promise resolving when the pair has been stored
   * @throws {InvalidInputError} If the pair is invalid
   */
  async storeRecentPair(pair: WordPair): Promise<void> {
    try {
      // Validate input
      if (!pair || typeof pair !== 'object') {
        throw new InvalidInputError('Word pair must be a valid object');
      }
      
      this.validateStringInput(pair.misspelling, 'Misspelled word');
      this.validateStringInput(pair.correct, 'Correct word');
      
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
    } catch (error) {
      // Rethrow if it's already one of our custom errors
      if (error instanceof WordPairServiceError) {
        throw error;
      }
      // Otherwise wrap it
      throw new InvalidInputError(`Error storing recent pair: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Returns the most recently used word pairs
   * 
   * @param count - Optional number of pairs to return (defaults to all)
   * @returns Promise resolving to an array of WordPairs
   * @throws {InvalidInputError} If count is invalid
   */
  async getRecentPairs(count?: number): Promise<WordPair[]> {
    try {
      // Validate count if provided
      if (count !== undefined) {
        if (typeof count !== 'number' || count < 0 || !Number.isInteger(count)) {
          throw new InvalidInputError('Count must be a non-negative integer');
        }
      }
      
      const limit = count ? Math.min(count, this.recentPairs.length) : this.recentPairs.length;
      return this.recentPairs.slice(0, limit);
    } catch (error) {
      // Rethrow if it's already one of our custom errors
      if (error instanceof WordPairServiceError) {
        throw error;
      }
      // Otherwise wrap it
      throw new WordPairServiceError(`Error getting recent pairs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Clears the recent pairs history
   * @returns Promise resolving when the operation is complete
   */
  async clearRecentPairs(): Promise<void> {
    this.recentPairs = [];
  }
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 and 1, where 1 means identical
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longerLength = Math.max(str1.length, str2.length);
  if (longerLength === 0) {
    return 1.0; // Both strings are empty
  }
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(str1, str2);
  
  // Calculate similarity as a value between 0 and 1
  return (longerLength - distance) / longerLength;
}

/**
 * Calculate Levenshtein distance between two strings
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance (number of operations to transform str1 to str2)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + cost // substitution
      );
    }
  }
  
  return track[str2.length][str1.length];
} 