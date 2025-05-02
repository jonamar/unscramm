/**
 * Computes an edit plan to transform a misspelled word into its correct form
 * The edit plan consists of deletions, insertions, and moves
 * 
 * @param misspelled The misspelled word
 * @param correct The correctly spelled word
 * @returns An object containing the edit operations in sequence
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function computeEditPlan(misspelled: string, correct: string) {
  // To be implemented in task 2
  return {
    deletions: [],
    insertions: [],
    moves: []
  };
}

/**
 * Identifies characters that should be considered as "moved" rather than deleted and inserted
 * 
 * @param misspelled The misspelled word
 * @param correct The correctly spelled word
 * @returns An array of character moves with source and destination positions
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function identifyTrueMovers(misspelled: string, correct: string) {
  // To be implemented in task 2
  return [];
} 