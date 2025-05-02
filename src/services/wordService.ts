/**
 * Interface representing a pair of words - a misspelling and its correct form
 */
export interface WordPair {
  misspelled: string;
  correct: string;
}

/**
 * Interface for a service that provides and manages word pairs
 */
export interface WordPairService {
  /**
   * Gets a random word pair from the available collection
   */
  getRandomPair(): Promise<WordPair>;
  
  /**
   * Gets a specific number of random word pairs
   * 
   * @param count The number of pairs to retrieve
   */
  getRandomPairs(count: number): Promise<WordPair[]>;
  
  /**
   * Validates if a word exists in the dictionary
   * 
   * @param word The word to check
   */
  isValidWord(word: string): Promise<boolean>;
}

/**
 * Implementation of WordPairService that uses a local JSON dictionary
 * This will be implemented in task 3
 */
export class LocalWordPairService implements WordPairService {
  private pairs: WordPair[] = [];
  
  constructor() {
    // To be implemented in task 3
  }
  
  async getRandomPair(): Promise<WordPair> {
    // To be implemented in task 3
    return { misspelled: '', correct: '' };
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getRandomPairs(count: number): Promise<WordPair[]> {
    // To be implemented in task 3
    return [];
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async isValidWord(word: string): Promise<boolean> {
    // To be implemented in task 3
    return false;
  }
} 