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
 * Letter snapshot used by the renderer for each animation phase.
 */
export interface PlanLetter {
  id: string;
  char: string;
}

interface SurvivorPair {
  sourceIndex: number;
  targetIndex: number;
  char: string;
}

interface PlanLetters {
  idle: PlanLetter[];
  afterDelete: PlanLetter[];
  moving: PlanLetter[];
  final: PlanLetter[];
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
  /** Survivor mapping pairs to drive moving + insertion phases */
  survivorPairs: SurvivorPair[];
  /** Mapping of target index -> source index for surviving letters */
  targetToSourceMap: Record<number, number>;
  /** Precomputed letter snapshots per phase */
  letters: PlanLetters;
  /** Whether each animation phase should execute */
  shouldDelete: boolean;
  shouldMove: boolean;
  shouldInsert: boolean;
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

  // Multiset counts for target and source
  const targetCounts: Record<string, number> = {};
  for (const c of target) targetCounts[c] = (targetCounts[c] || 0) + 1;

  // Determine deletions by scanning source left→right, keep only as many as target requires
  const remainingTargetNeed: Record<string, number> = { ...targetCounts };
  const deletions: number[] = [];
  const keptSourceIndices: number[] = [];
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if ((remainingTargetNeed[ch] || 0) > 0) {
      remainingTargetNeed[ch]! -= 1;
      keptSourceIndices.push(i);
    } else {
      deletions.push(i);
    }
  }
  deletions.sort((a, b) => b - a);

  // Determine insertions by scanning target left→right, insert where source lacks required count
  const remainingSourceAvail: Record<string, number> = {};
  for (const c of source) remainingSourceAvail[c] = (remainingSourceAvail[c] || 0) + 1;
  const insertions: Insertion[] = [];
  for (let j = 0; j < target.length; j++) {
    const ch = target[j];
    if ((remainingSourceAvail[ch] || 0) > 0) {
      remainingSourceAvail[ch]! -= 1;
    } else {
      insertions.push({ letter: ch, position: j });
    }
  }

  // Build survivor mapping (pairs) by greedily matching target positions to the next unused kept source occurrence
  const used = new Set<number>();
  const pairs: Array<[number, number]> = [];
  for (let tIdx = 0; tIdx < target.length; tIdx++) {
    const ch = target[tIdx];
    // find next kept source index with same char not used
    let found = -1;
    for (const sIdx of keptSourceIndices) {
      if (!used.has(sIdx) && source[sIdx] === ch) { found = sIdx; break; }
    }
    if (found >= 0) {
      used.add(found);
      pairs.push([found, tIdx]);
    }
  }

  // Moves are pairs that break monotonic order (same check as before but on survivor pairs)
  const moves: Move[] = [];
  for (let k = 0; k < pairs.length; k++) {
    const [sIdx, tIdx] = pairs[k];
    let isOutOfOrder = false;
    for (let i = 0; i < k; i++) {
      const [prevS, prevT] = pairs[i];
      if (sIdx > prevS && tIdx < prevT) { isOutOfOrder = true; break; }
    }
    if (!isOutOfOrder) {
      for (let i = k + 1; i < pairs.length; i++) {
        const [nextS, nextT] = pairs[i];
        if (sIdx < nextS && tIdx > nextT) { isOutOfOrder = true; break; }
      }
    }
    if (isOutOfOrder) moves.push({ fromIndex: sIdx, toIndex: tIdx });
  }

  const highlightIndices = identifyTrueMovers(pairs);

  const survivorPairs: SurvivorPair[] = [];
  const targetToSourceMap: Record<number, number> = {};
  for (const [sIdx, tIdx] of pairs) {
    survivorPairs.push({
      sourceIndex: sIdx,
      targetIndex: tIdx,
      char: target[tIdx],
    });
    targetToSourceMap[tIdx] = sIdx;
  }

  const idleLetters: PlanLetter[] = source.map((char, i) => ({ id: `src-${i}`, char }));
  const deletionSet = new Set(deletions);
  const afterDelete: PlanLetter[] = idleLetters.filter((_, idx) => !deletionSet.has(idx));
  const movingLetters: PlanLetter[] = survivorPairs
    .slice()
    .sort((a, b) => a.targetIndex - b.targetIndex)
    .map(({ sourceIndex, char }) => ({ id: `src-${sourceIndex}`, char }));
  const finalLetters: PlanLetter[] = target.map((char, idx) => {
    const sourceIndex = targetToSourceMap[idx];
    if (sourceIndex !== undefined) {
      return { id: `src-${sourceIndex}`, char };
    }
    return { id: `ins-${idx}`, char };
  });

  const letters: PlanLetters = {
    idle: idleLetters,
    afterDelete,
    moving: movingLetters,
    final: finalLetters,
  };

  const shouldDelete = deletions.length > 0;
  const shouldInsert = insertions.length > 0;
  const shouldMove = survivorPairs.length > 0 && sourceWord !== targetWord;

  return {
    deletions,
    insertions,
    moves,
    highlightIndices,
    survivorPairs,
    targetToSourceMap,
    letters,
    shouldDelete,
    shouldMove,
    shouldInsert,
  };
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

