import { LocalWordPairService } from '../../src/services/localWordPairService';
import { WordPair } from '../../src/services/wordPairService';

// Import jest explicitly
import * as jestImport from '@jest/globals';
const { jest, describe, it, expect, beforeEach } = jestImport;

describe('LocalWordPairService', () => {
  let service: LocalWordPairService;

  beforeEach(() => {
    service = new LocalWordPairService();
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

  describe('API Implementation', () => {
    it('should implement getRandomPair method', async () => {
      const pair = await service.getRandomPair();
      expect(pair).toBeDefined();
      expect(pair).toHaveProperty('misspelling');
      expect(pair).toHaveProperty('correct');
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
      expect(recentPairs[0]).toEqual(pair);
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
      const limitedService = new LocalWordPairService('/data/wordPairs.json', 3);

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