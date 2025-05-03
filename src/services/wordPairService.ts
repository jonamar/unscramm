/**
 * WordPair Interface
 * Represents a pair of misspelled and correct words
 */
export interface WordPair {
  /**
   * The misspelled version of the word
   */
  misspelling: string;
  
  /**
   * The correct spelling of the word
   */
  correct: string;
  
  /**
   * Optional unique identifier for the word pair
   */
  id?: string;
}

/**
 * WordPairService Interface
 * Defines the contract for services that provide and manage word pairs
 * for the spelling correction animation
 */
export interface WordPairService {
  /**
   * Returns one random word pair from the available dictionary
   * @returns Promise resolving to a WordPair
   */
  getRandomPair(): Promise<WordPair>;
  
  /**
   * Validates whether a given word pair is considered valid
   * (e.g., the words are different, not empty, etc.)
   * 
   * @param misspelling - The misspelled version of the word
   * @param correct - The correct spelling of the word
   * @returns Promise resolving to a boolean indicating validity
   */
  validateWordPair(misspelling: string, correct: string): Promise<boolean>;
  
  /**
   * Stores a word pair in the recent history
   * 
   * @param pair - The WordPair to store
   * @returns Promise resolving when the pair has been stored
   */
  storeRecentPair(pair: WordPair): Promise<void>;
  
  /**
   * Returns the most recently used word pairs
   * 
   * @param count - Optional number of pairs to return (defaults to all)
   * @returns Promise resolving to an array of WordPairs
   */
  getRecentPairs(count?: number): Promise<WordPair[]>;
} 