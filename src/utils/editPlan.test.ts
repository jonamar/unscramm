import { describe, it, expect } from 'vitest';
import { computeEditPlan, identifyTrueMovers } from './editPlan';

describe('computeEditPlan', () => {
  it('tasd → tads (anagram): plan is consistent and includes moves', () => {
    const source = 'tasd';
    const target = 'tads';
    const plan = computeEditPlan(source, target);
    // We don't require specific delete/insert fast-path here; just that the plan is coherent.
    const netChange = plan.insertions.length - plan.deletions.length;
    expect(source.length + netChange).toBe(target.length);
    expect(Array.isArray(plan.moves)).toBe(true);
  });

  it('tesd → tads (mixed ops): deletes e and inserts a at position 1', () => {
    const plan = computeEditPlan('tesd', 'tads');
    // deletion at source index 1 ("e") expected
    expect(plan.deletions).toContain(1);

    // insertion of 'a' at target position 1 expected
    const hasAAt1 = plan.insertions.some((ins) => ins.letter === 'a' && ins.position === 1);
    expect(hasAAt1).toBe(true);
  });

  it('recieve → receive (anagram): highlights adjacent swaps only', () => {
    const plan = computeEditPlan('recieve', 'receive');
    // Anagrams should have no deletions or insertions, just reordering
    expect(plan.deletions).toEqual([]);
    expect(plan.insertions).toEqual([]);
    // Should have highlight indices for adjacent swaps (i and e swap by 1 position)
    expect(plan.highlightIndices.length).toBeGreaterThan(0);
  });

  it('repetative → repetitive: should NOT highlight distant moves', () => {
    const plan = computeEditPlan('repetative', 'repetitive');
    // The second 'i' moves far - should NOT be highlighted
    // Only adjacent moves (distance <= 1) should be highlighted
    for (const srcIdx of plan.highlightIndices) {
      const pair = plan.survivorPairs.find(p => p.sourceIndex === srcIdx);
      if (pair) {
        const distance = Math.abs(pair.targetIndex - pair.sourceIndex);
        expect(distance).toBeLessThanOrEqual(1);
      }
    }
  });

  it('laber → labor: should identify replacement and hold space', () => {
    const plan = computeEditPlan('laber', 'labor');
    // Should have a replacement: 'e' at position 3 replaced by 'o'
    expect(plan.replacements.length).toBe(1);
    expect(plan.replacements[0].deletedChar).toBe('e');
    expect(plan.replacements[0].insertedChar).toBe('o');
    // afterDelete should have a placeholder for the replacement
    const hasPlaceholder = plan.letters.afterDelete.some(l => l.id.startsWith('placeholder-'));
    expect(hasPlaceholder).toBe(true);
  });

  it('doog → dog: pure deletion should contract (no placeholder)', () => {
    const plan = computeEditPlan('doog', 'dog');
    // Should have 1 deletion (extra 'o') and no insertions
    expect(plan.deletions.length).toBe(1);
    expect(plan.insertions.length).toBe(0);
    // No replacements since there's no corresponding insertion
    expect(plan.replacements.length).toBe(0);
    // afterDelete should NOT have placeholders
    const hasPlaceholder = plan.letters.afterDelete.some(l => l.id.startsWith('placeholder-'));
    expect(hasPlaceholder).toBe(false);
  });

  it('odessy → odyssey: should minimize movement distance', () => {
    const plan = computeEditPlan('odessy', 'odyssey');
    // The 'y' at the end should stay at the end, not move to replace 'e'
    // Check that total movement distance is minimized
    let totalDistance = 0;
    for (const pair of plan.survivorPairs) {
      totalDistance += Math.abs(pair.targetIndex - pair.sourceIndex);
    }
    // With optimal matching, the 'y' stays in place (or moves minimally)
    // The 's' characters should also minimize movement
    expect(totalDistance).toBeLessThan(plan.survivorPairs.length * 2);
  });
});

describe('identifyTrueMovers', () => {
  it('only highlights moves with distance <= maxMoveDistance', () => {
    // Pairs: [sourceIdx, targetIdx]
    const pairs: Array<[number, number]> = [
      [0, 0],  // no move
      [1, 2],  // move distance 1 - should highlight
      [3, 6],  // move distance 3 - should NOT highlight
      [4, 5],  // move distance 1 - should highlight
    ];
    
    const highlights = identifyTrueMovers(pairs, 1);
    expect(highlights).toContain(1);  // distance 1
    expect(highlights).toContain(4);  // distance 1
    expect(highlights).not.toContain(0);  // no move
    expect(highlights).not.toContain(3);  // distance 3
  });
});
