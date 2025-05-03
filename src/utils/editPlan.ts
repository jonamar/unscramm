import { findLCSPositions, findLCSPositionsFromStrings } from './lcs';

/**
 * Represents an insertion operation in the edit plan
 */
export interface Insertion {
  /** The character to insert */
  letter: string;
  /** The position where the character should be inserted */
  position: number;
}

/**
 * Represents a movement operation in the edit plan
 */
export interface Move {
  /** The original position of the character in the source word */
  fromIndex: number;
  /** The new position of the character in the target word */
  toIndex: number;
}

/**
 * The complete edit plan between two words
 */
export interface EditPlan {
  /** Indices in the source word that need to be deleted */
  deletions: number[];
  /** Characters that need to be inserted with their positions */
  insertions: Insertion[];
  /** Characters that need to be moved from one position to another */
  moves: Move[];
  /** Source indices of characters that are "true movers" that should be highlighted */
  highlightIndices: number[];
}

/**
 * Computes an edit plan between a source (misspelled) word and a target (correct) word.
 * 
 * The edit plan includes:
 * - Characters to delete from the source word
 * - Characters to insert into the target word
 * - Characters that need to move from one position to another
 * - Characters that are "true movers" (those that break formation relative to other characters)
 * 
 * @param sourceWord - The source word (typically misspelled)
 * @param targetWord - The target word (typically correct spelling)
 * @returns A complete edit plan with deletions, insertions, moves, and highlights
 */
export function computeEditPlan(sourceWord: string, targetWord: string): EditPlan {
  // Split words into character arrays
  const source = sourceWord.split('');
  const target = targetWord.split('');

  // 1. Find LCS matches to identify common characters
  const matches = findLCSPositions(source, target);

  // 2. Deletions = any source index not in matches.sourceIndices
  const deletions: number[] = [];
  for (let i = 0; i < source.length; i++) {
    if (!matches.sourceIndices.includes(i)) {
      deletions.push(i);
    }
  }
  // Sort deletions in descending order so removing right→left doesn't shift later indices
  deletions.sort((a, b) => b - a);

  // 3. Insertions = any target index not in matches.targetIndices
  const insertions: Insertion[] = [];
  for (let j = 0; j < target.length; j++) {
    if (!matches.targetIndices.includes(j)) {
      insertions.push({ letter: target[j], position: j });
    }
  }
  // Sort insertions ascending so we insert left→right
  insertions.sort((a, b) => a.position - b.position);

  // 4. Moves = any matched pair where sourceIdx ≠ targetIdx
  const moves: Move[] = [];
  for (const [sIdx, tIdx] of matches.pairs) {
    if (sIdx !== tIdx) {
      moves.push({ fromIndex: sIdx, toIndex: tIdx });
    }
  }

  // 5. Highlight = "true movers" = those matched letters whose shift deviates from bulk
  const highlightIndices = identifyTrueMovers(matches.pairs);

  return { deletions, insertions, moves, highlightIndices };
}

/**
 * Identifies "true movers" - characters that break formation relative to other characters.
 * 
 * A true mover is a character whose individual shift (targetIndex - sourceIndex) doesn't
 * match the most common bulk shift. These characters typically need special highlighting
 * during animation.
 * 
 * @param pairs - Array of [sourceIndex, targetIndex] pairs from the LCS result
 * @returns Array of source indices to highlight as true movers
 */
export function identifyTrueMovers(pairs: Array<[number, number]>): number[] {
  // If we have 0-1 pairs, there are no true movers to identify
  if (pairs.length <= 1) {
    return [];
  }

  // Count the frequency of each shift value
  const shiftCounts: Record<number, number> = {};
  
  // Calculate shift for each pair and tally the counts
  for (const [sIdx, tIdx] of pairs) {
    const shift = tIdx - sIdx;
    shiftCounts[shift] = (shiftCounts[shift] || 0) + 1;
  }

  // Find the most common shift value (the "bulk shift")
  let bulkShift = 0;
  let maxCount = 0;
  
  for (const [shift, count] of Object.entries(shiftCounts)) {
    if (count > maxCount) {
      maxCount = count;
      bulkShift = parseInt(shift, 10);
    }
  }

  // Collect source indices of characters whose shift doesn't match the bulk shift
  const highlightIndices: number[] = [];
  
  for (const [sIdx, tIdx] of pairs) {
    if ((tIdx - sIdx) !== bulkShift) {
      highlightIndices.push(sIdx);
    }
  }

  return highlightIndices;
} 