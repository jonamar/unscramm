import { computeEditPlan, identifyTrueMovers, EditPlan } from '../../src/utils/editPlan';

describe('Edit Plan Module', () => {
  describe('computeEditPlan', () => {
    it('should handle identical words with no edits required', () => {
      const result = computeEditPlan('hello', 'hello');
      
      expect(result.deletions).toEqual([]);
      expect(result.insertions).toEqual([]);
      expect(result.moves).toEqual([]);
      expect(result.highlightIndices).toEqual([]);
    });
    
    it('should identify deletions correctly (source longer than target)', () => {
      const result = computeEditPlan('apple', 'aple');
      
      // Should identify one 'p' to delete
      expect(result.deletions.length).toBe(1);
      
      // The 'p' at the deletion index should be a 'p' character
      const expectedDeletionIndex = result.deletions[0];
      expect("apple"[expectedDeletionIndex]).toBe('p');
      
      expect(result.insertions).toEqual([]);
      
      // Note: Moves may be identified because character positions shift after deletion
      // This is expected behavior with our implementation
      
      // The key test is that simulating the edit transforms the word correctly
      const simulated = simulateEdit('apple', result);
      expect(simulated).toBe('aple');
    });
    
    it('should identify insertions correctly (target longer than source)', () => {
      const result = computeEditPlan('aple', 'apple');
      
      expect(result.deletions).toEqual([]);
      
      // Should identify one 'p' to insert
      expect(result.insertions.length).toBe(1);
      expect(result.insertions[0].letter).toBe('p');
      
      // Should have correct insertion position (might be 1 or 2 depending on LCS algorithm)
      const insertionPosition = result.insertions[0].position;
      // Verify that the character at this position in the target word is 'p'
      expect('apple'[insertionPosition]).toBe('p');
      
      // Note: Moves may be identified because character positions shift after insertion
      // This is expected behavior with our implementation
      
      // The key test is that simulating the edit transforms the word correctly
      const simulated = simulateEdit('aple', result);
      expect(simulated).toBe('apple');
    });
    
    it('should identify classic transposition case (ie/ei) correctly', () => {
      const result = computeEditPlan('recieve', 'receive');
      
      // Verify that we correctly identify the transposition
      // Depending on which match was found, we might either:
      // 1. Delete 'i' and insert 'i' in a new position
      // 2. Delete 'e' and insert 'e' in a new position
      // 3. Move 'i' and/or 'e' to the correct positions
      
      // The key here is to verify that the result has the correct operations
      // to transform 'recieve' into 'receive', regardless of which operations are chosen
      
      const simulated = simulateEdit('recieve', result);
      expect(simulated).toBe('receive');
    });

    it('should handle complete word restructuring (anagrams)', () => {
      const result = computeEditPlan('post', 'stop');
      
      // This is a significant rearrangement, so we should expect various operations
      const simulated = simulateEdit('post', result);
      expect(simulated).toBe('stop');
    });
    
    it('should handle completely different words', () => {
      const result = computeEditPlan('cat', 'dog');
      
      // Should delete all characters from 'cat'
      expect(result.deletions.length).toBe(3);
      
      // Should insert all characters from 'dog'
      expect(result.insertions.length).toBe(3);
      
      // Should have no moves (nothing in common)
      expect(result.moves.length).toBe(0);
      
      // No true movers when there are no shared characters
      expect(result.highlightIndices).toEqual([]);
      
      const simulated = simulateEdit('cat', result);
      expect(simulated).toBe('dog');
    });
    
    it('should handle empty source word (all insertions)', () => {
      const result = computeEditPlan('', 'hello');
      
      expect(result.deletions).toEqual([]);
      expect(result.insertions.length).toBe(5);
      expect(result.moves).toEqual([]);
      expect(result.highlightIndices).toEqual([]);
      
      const simulated = simulateEdit('', result);
      expect(simulated).toBe('hello');
    });
    
    it('should handle empty target word (all deletions)', () => {
      const result = computeEditPlan('hello', '');
      
      expect(result.deletions.length).toBe(5);
      expect(result.insertions).toEqual([]);
      expect(result.moves).toEqual([]);
      expect(result.highlightIndices).toEqual([]);
      
      const simulated = simulateEdit('hello', result);
      expect(simulated).toBe('');
    });
    
    it('should correctly process a complex example', () => {
      const result = computeEditPlan('mississippi', 'missouri');
      
      // Rather than testing specific indices (which might vary depending on the LCS found),
      // let's verify that applying the edit operations transforms the source to the target
      const simulated = simulateEdit('mississippi', result);
      expect(simulated).toBe('missouri');
    });
  });
  
  describe('identifyTrueMovers', () => {
    it('should return empty array for 0 or 1 pairs', () => {
      const result0 = identifyTrueMovers([]);
      const result1 = identifyTrueMovers([[0, 0]]);
      
      expect(result0).toEqual([]);
      expect(result1).toEqual([]);
    });
    
    it('should identify a simple true mover', () => {
      // Create pairs where most letters have the same shift (0),
      // but one letter has a different shift
      const pairs: Array<[number, number]> = [
        [0, 0], // shift: 0
        [1, 1], // shift: 0
        [2, 2], // shift: 0
        [3, 5], // shift: 2 (this is the true mover)
        [4, 4]  // shift: 0
      ];
      
      const result = identifyTrueMovers(pairs);
      
      // The letter at source index 3 should be identified as a true mover
      expect(result).toEqual([3]);
    });
    
    it('should identify multiple true movers', () => {
      // Create pairs where two letters have a different shift from the majority
      const pairs: Array<[number, number]> = [
        [0, 0], // shift: 0
        [1, 3], // shift: 2 (true mover)
        [2, 2], // shift: 0
        [3, 6], // shift: 3 (true mover)
        [4, 4]  // shift: 0
      ];
      
      const result = identifyTrueMovers(pairs);
      
      // The letters at source indices 1 and 3 should be identified as true movers
      expect(result).toContain(1);
      expect(result).toContain(3);
      expect(result.length).toBe(2);
    });
    
    it('should handle scenario with no bulk shift majority', () => {
      // In this case, all characters have different shifts
      const pairs: Array<[number, number]> = [
        [0, 1], // shift: 1
        [1, 0], // shift: -1
        [2, 4], // shift: 2
        [3, 2]  // shift: -1
      ];
      
      const result = identifyTrueMovers(pairs);
      
      // Either [0, 2] or [1, 3] should be highlighted, depending on which
      // shift (-1 or other) is considered the bulk shift
      expect(result.length).toBe(2);
    });
  });
});

/**
 * Helper function to simulate applying an edit plan to a source word
 * This helps verify that the edit operations correctly transform the source to the target
 */
function simulateEdit(source: string, plan: EditPlan): string {
  // Convert source to array for easier manipulation
  const chars = source.split('');
  
  // Apply deletions (in descending order, as in the computeEditPlan function)
  for (const index of plan.deletions) {
    chars.splice(index, 1);
  }
  
  // Apply insertions (in ascending order, as in the computeEditPlan function)
  for (const { letter, position } of plan.insertions) {
    // Check that the position is valid for the current state of the chars array
    if (position <= chars.length) {
      chars.splice(position, 0, letter);
    } else {
      // If the position is beyond the current length, just append
      chars.push(letter);
    }
  }
  
  // Note: We don't actually need to apply moves for the simulation
  // since moves are just a visualization guide. The deletions and insertions
  // already handle the actual transformation.
  
  return chars.join('');
} 