import { LocalWordPairService } from '../../src/services/localWordPairService';
import { WordPair } from '../../src/services/wordPairService';

// Import jest explicitly
import * as jestImport from '@jest/globals';
const { jest, describe, it, expect, beforeEach, afterEach } = jestImport;

// Sample word pairs for testing
const sampleWordPairs = {
  metadata: {
    description: "Test dictionary",
    version: "1.0.0",
    updated: "2023-06-01"
  },
  wordPairs: [
    { misspelling: "recieve", correct: "receive" },
    { misspelling: "definately", correct: "definitely" },
    { misspelling: "occured", correct: "occurred" },
    { misspelling: "beleive", correct: "believe" },
    { misspelling: "goverment", correct: "government" }
  ]
};

describe('LocalWordPairService', () => {
  let service: LocalWordPairService;
  
  // Mock global fetch
  const originalFetch = global.fetch;
  
  // Setup mocks before each test
  beforeEach(() => {
    // Restore fetch to a jest mock before each test
    global.fetch = jest.fn() as any;
    
    // Default mock implementation returns successful response with sample data
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleWordPairs)
      })
    );
    
    service = new LocalWordPairService('/test-dictionary-path.json');
  });
  
  // Clean up mocks after each test
  afterEach(() => {
    jest.resetAllMocks();
    global.fetch = originalFetch;
  });

  describe('Constructor', () => {
    it('should create an instance with default parameters', () => {
      expect(service).toBeInstanceOf(LocalWordPairService);
    });

    it('should accept custom parameters', () => {
      const customService = new LocalWordPairService('/custom/path.json', 20);
      expect(customService).toBeInstanceOf(LocalWordPairService);
    });
  });

  describe('Dictionary Loading', () => {
    it('should load the dictionary from the specified path', async () => {
      await service.getRandomPair(); // This will trigger dictionary loading
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/test-dictionary-path.json');
    });
    
    it('should handle loading errors with fallback dictionary', async () => {
      // Mock fetch to fail
      (global.fetch as jest.Mock).mockImplementation(() => 
        Promise.resolve({
          ok: false,
          statusText: 'Not Found'
        })
      );
      
      // Expect the service to throw but use fallback
      await expect(service.getRandomPair()).resolves.toBeDefined();
      
      // Should still have some fallback pairs
      const recentPairs = await service.getRecentPairs();
      expect(recentPairs).toHaveLength(1);
    });
    
    it('should validate dictionary entries', async () => {
      // Mock a dictionary with some invalid entries
      const invalidEntries = {
        metadata: { description: "Test", version: "1.0", updated: "2023" },
        wordPairs: [
          { misspelling: "", correct: "valid" }, // Invalid: empty misspelling
          { misspelling: "valid", correct: "" }, // Invalid: empty correct
          { misspelling: "valid", correct: "valid" } // Valid
        ]
      };
      
      (global.fetch as jest.Mock).mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(invalidEntries)
        })
      );
      
      // Warning should be logged about invalid entries
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      await service.getRandomPair();
      
      // Should warn about invalid entries
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      
      consoleSpy.mockRestore();
    });
  });

  describe('API Implementation', () => {
    it('should get a random word pair', async () => {
      const pair = await service.getRandomPair();
      
      // Verify it's one of our sample pairs
      expect(sampleWordPairs.wordPairs.some(p => 
        p.misspelling === pair.misspelling && p.correct === pair.correct
      )).toBe(true);
      
      // Verify it has an ID
      expect(pair.id).toBeDefined();
    });
    
    it('should avoid returning the same pair consecutively', async () => {
      // With small dictionary, we need multiple attempts to test this
      const firstPair = await service.getRandomPair();
      
      // Force the mock to always return the first pair
      const mockedRandom = jest.spyOn(Math, 'random');
      mockedRandom.mockReturnValue(0);
      
      // Even with random always 0, it should not return the same pair
      const secondPair = await service.getRandomPair();
      expect(secondPair.id).not.toBe(firstPair.id);
      
      mockedRandom.mockRestore();
    });
    
    it('should add returned pairs to recent pairs', async () => {
      // Get three random pairs
      const pair1 = await service.getRandomPair();
      const pair2 = await service.getRandomPair();
      const pair3 = await service.getRandomPair();
      
      // Check recent pairs
      const recent = await service.getRecentPairs();
      expect(recent).toHaveLength(3);
      
      // Should be in reverse order (newest first)
      expect(recent[0].id).toBe(pair3.id);
      expect(recent[1].id).toBe(pair2.id);
      expect(recent[2].id).toBe(pair1.id);
    });

    it('should implement validateWordPair method', async () => {
      // Valid case - different words, both non-empty
      const validResult = await service.validateWordPair('misspelled', 'corrected');
      expect(validResult).toBe(true);

      // Invalid case - same words
      const invalidResult1 = await service.validateWordPair('word', 'word');
      expect(invalidResult1).toBe(false);

      // Invalid case - empty misspelling
      const invalidResult2 = await service.validateWordPair('', 'corrected');
      expect(invalidResult2).toBe(false);

      // Invalid case - empty correct
      const invalidResult3 = await service.validateWordPair('misspelled', '');
      expect(invalidResult3).toBe(false);
    });

    it('should implement storeRecentPair method', async () => {
      const pair: WordPair = {
        misspelling: 'teh',
        correct: 'the'
      };

      await service.storeRecentPair(pair);
      const recentPairs = await service.getRecentPairs();
      expect(recentPairs).toHaveLength(1);
      expect(recentPairs[0].misspelling).toBe(pair.misspelling);
      expect(recentPairs[0].correct).toBe(pair.correct);
      // Should have added an ID
      expect(recentPairs[0].id).toBeDefined();
    });

    it('should prevent duplicate entries in recent pairs', async () => {
      const pair: WordPair = {
        misspelling: 'teh',
        correct: 'the',
        id: 'test-id'
      };
      
      // Add the same pair twice
      await service.storeRecentPair(pair);
      await service.storeRecentPair(pair);
      
      // Should only have one entry
      const recentPairs = await service.getRecentPairs();
      expect(recentPairs).toHaveLength(1);
    });

    it('should implement getRecentPairs method', async () => {
      // Add some test pairs
      await service.storeRecentPair({ misspelling: 'teh', correct: 'the' });
      await service.storeRecentPair({ misspelling: 'wierd', correct: 'weird' });
      await service.storeRecentPair({ misspelling: 'recieve', correct: 'receive' });

      // Get all recent pairs
      const allPairs = await service.getRecentPairs();
      expect(allPairs).toHaveLength(3);

      // Get limited recent pairs
      const limitedPairs = await service.getRecentPairs(2);
      expect(limitedPairs).toHaveLength(2);
      // Should return newest pairs first
      expect(limitedPairs[0].misspelling).toBe('recieve');
    });

    it('should implement clearRecentPairs method', async () => {
      // Add some test pairs
      await service.storeRecentPair({ misspelling: 'teh', correct: 'the' });
      await service.storeRecentPair({ misspelling: 'wierd', correct: 'weird' });

      // Verify pairs were added
      expect(await service.getRecentPairs()).toHaveLength(2);

      // Clear the pairs
      await service.clearRecentPairs();

      // Verify pairs were cleared
      expect(await service.getRecentPairs()).toHaveLength(0);
    });

    it('should limit the number of recent pairs', async () => {
      // Create service with max 3 recent pairs
      const limitedService = new LocalWordPairService('/test-path.json', 3);

      // Add more pairs than the limit
      await limitedService.storeRecentPair({ misspelling: 'pair1', correct: 'corrected1' });
      await limitedService.storeRecentPair({ misspelling: 'pair2', correct: 'corrected2' });
      await limitedService.storeRecentPair({ misspelling: 'pair3', correct: 'corrected3' });
      await limitedService.storeRecentPair({ misspelling: 'pair4', correct: 'corrected4' });
      await limitedService.storeRecentPair({ misspelling: 'pair5', correct: 'corrected5' });

      // Check that only the most recent 3 are kept
      const recentPairs = await limitedService.getRecentPairs();
      expect(recentPairs).toHaveLength(3);
      expect(recentPairs[0].misspelling).toBe('pair5');
      expect(recentPairs[1].misspelling).toBe('pair4');
      expect(recentPairs[2].misspelling).toBe('pair3');
    });
  });
}); 