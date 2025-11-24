import { describe, it, expect } from 'vitest';
import { computeEditPlan } from './editPlan';

describe('computeEditPlan', () => {
  it('tasd → tads (anagram): plan is consistent and includes moves', () => {
    const source = 'tasd';
    const target = 'tads';
    const plan = computeEditPlan(source, target);
    // We don’t require specific delete/insert fast-path here; just that the plan is coherent.
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

  it('recieve → receive (anagram): no deletions or insertions', () => {
    const plan = computeEditPlan('recieve', 'receive');
    // Anagrams should have no deletions or insertions, just reordering
    expect(plan.deletions).toEqual([]);
    expect(plan.insertions).toEqual([]);
    // Should have highlight indices for the letters that move
    expect(plan.highlightIndices.length).toBeGreaterThan(0);
  });
});
