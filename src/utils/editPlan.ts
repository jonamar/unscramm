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
 * Represents a replacement operation where a deletion and insertion occur at the same position.
 * These should hold their space open during animation to show the positional relationship.
 */
export interface Replacement {
  /** The source index of the deleted character */
  sourceIndex: number;
  /** The target index where the new character will be inserted */
  targetIndex: number;
  /** The character being deleted */
  deletedChar: string;
  /** The character being inserted */
  insertedChar: string;
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
  /** Replacement pairs where a deletion and insertion occur at the same position */
  replacements: Replacement[];
  /** Precomputed letter snapshots per phase */
  letters: PlanLetters;
  /** Whether each animation phase should execute */
  shouldDelete: boolean;
  shouldMove: boolean;
  shouldInsert: boolean;
}

/**
 * Finds the minimum-cost matching between source and target indices for a single character.
 * Uses a greedy approach that iteratively picks the pair with minimum distance.
 * This minimizes total movement distance for characters of the same type.
 * 
 * @param srcIndices - Source positions of this character
 * @param tgtIndices - Target positions where this character should go
 * @returns Array of [sourceIndex, targetIndex] pairs
 */
function findMinCostMatching(
  srcIndices: number[],
  tgtIndices: number[]
): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  const usedSrc = new Set<number>();
  const usedTgt = new Set<number>();
  
  // Create all possible pairings with their costs (distances)
  const candidates: Array<{ src: number; tgt: number; cost: number }> = [];
  for (const src of srcIndices) {
    for (const tgt of tgtIndices) {
      candidates.push({ src, tgt, cost: Math.abs(tgt - src) });
    }
  }
  
  // Sort by cost (prefer minimal movement)
  candidates.sort((a, b) => a.cost - b.cost);
  
  // Greedily pick pairs with minimum cost
  for (const { src, tgt } of candidates) {
    if (!usedSrc.has(src) && !usedTgt.has(tgt)) {
      pairs.push([src, tgt]);
      usedSrc.add(src);
      usedTgt.add(tgt);
    }
  }
  
  return pairs;
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

  // Build survivor mapping (pairs) using minimum-cost matching to minimize total movement distance
  // Group kept source indices by character
  const sourceByChar: Record<string, number[]> = {};
  for (const sIdx of keptSourceIndices) {
    const ch = source[sIdx];
    if (!sourceByChar[ch]) sourceByChar[ch] = [];
    sourceByChar[ch].push(sIdx);
  }

  // Group target positions by character
  const targetByChar: Record<string, number[]> = {};
  for (let tIdx = 0; tIdx < target.length; tIdx++) {
    const ch = target[tIdx];
    if (!targetByChar[ch]) targetByChar[ch] = [];
    targetByChar[ch].push(tIdx);
  }

  // For each character, find the optimal matching that minimizes total movement
  const pairs: Array<[number, number]> = [];
  for (const ch of Object.keys(sourceByChar)) {
    const srcIndices = sourceByChar[ch];
    const tgtIndices = targetByChar[ch] || [];
    
    // Use minimum-cost matching for this character
    // For small arrays, we can use a simple greedy approach that prefers minimal distance
    const matchedPairs = findMinCostMatching(srcIndices, tgtIndices);
    pairs.push(...matchedPairs);
  }
  
  // Sort pairs by target index for consistent processing
  pairs.sort((a, b) => a[1] - b[1]);

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

  // Identify replacements: deletions that have a corresponding insertion at the same target position
  // For laber → labor: deletion at source index 3 ('e') pairs with insertion at target index 3 ('o')
  const replacements: Replacement[] = [];
  const insertionByPosition = new Map<number, Insertion>();
  for (const ins of insertions) {
    insertionByPosition.set(ins.position, ins);
  }
  
  // Map source deletion indices to their effective target positions
  // A deletion at source index i, after accounting for other deletions before it,
  // corresponds to a target position. We need to find which insertions fill those gaps.
  const deletionSet = new Set(deletions);
  const replacementSourceIndices = new Set<number>();
  const replacementTargetIndices = new Set<number>();
  
  for (const delIdx of deletions) {
    // Find the effective position in the target by looking at what's around this deletion
    // The deletion at source[delIdx] leaves a gap. If there's an insertion at the same
    // logical position in the target, it's a replacement.
    
    // Count survivors before this deletion to find the target position
    let survivorsBefore = 0;
    for (const [sIdx] of pairs) {
      if (sIdx < delIdx) survivorsBefore++;
    }
    
    // The gap is at target position = survivorsBefore (0-indexed)
    // But we also need to account for insertions before this position
    // Actually, simpler: check if there's an insertion at a position where
    // the surrounding survivors suggest a replacement
    
    // Find the insertion that would fill this gap
    const ins = insertionByPosition.get(survivorsBefore);
    if (ins) {
      replacements.push({
        sourceIndex: delIdx,
        targetIndex: ins.position,
        deletedChar: source[delIdx],
        insertedChar: ins.letter,
      });
      replacementSourceIndices.add(delIdx);
      replacementTargetIndices.add(ins.position);
    }
  }

  const idleLetters: PlanLetter[] = source.map((char, i) => ({ id: `src-${i}`, char }));
  
  // For afterDelete: keep placeholder spaces for replacements, remove pure deletions
  // Replacements use a placeholder character to hold the space open
  const afterDelete: PlanLetter[] = [];
  for (let idx = 0; idx < source.length; idx++) {
    if (deletionSet.has(idx)) {
      // Check if this is a replacement (has corresponding insertion)
      if (replacementSourceIndices.has(idx)) {
        // Keep a placeholder space to show the position is being replaced
        afterDelete.push({ id: `placeholder-${idx}`, char: '\u00A0' }); // non-breaking space
      }
      // Pure deletions are removed (not added to afterDelete)
    } else {
      afterDelete.push(idleLetters[idx]);
    }
  }
  
  // For moving phase: include placeholders for replacements in their target positions
  const movingLetters: PlanLetter[] = [];
  const sortedSurvivors = survivorPairs.slice().sort((a, b) => a.targetIndex - b.targetIndex);
  
  // Build the moving phase by interleaving survivors and replacement placeholders
  let survivorIdx = 0;
  for (let tIdx = 0; tIdx < target.length; tIdx++) {
    if (replacementTargetIndices.has(tIdx)) {
      // Find the replacement for this target position
      const repl = replacements.find(r => r.targetIndex === tIdx);
      if (repl) {
        movingLetters.push({ id: `placeholder-${repl.sourceIndex}`, char: '\u00A0' });
      }
    } else if (survivorIdx < sortedSurvivors.length && sortedSurvivors[survivorIdx].targetIndex === tIdx) {
      const { sourceIndex, char } = sortedSurvivors[survivorIdx];
      movingLetters.push({ id: `src-${sourceIndex}`, char });
      survivorIdx++;
    }
  }
  
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
    replacements,
    letters,
    shouldDelete,
    shouldMove,
    shouldInsert,
  };
}

/**
 * Identifies "true movers" - characters that move a short distance (adjacent swaps).
 * 
 * Only highlights characters that move 1-2 positions, making the animation feel like
 * a clarification of the misspelling rather than a magic trick. For example:
 * - recieve → receive: the 'i' and 'e' swap (distance 1) - HIGHLIGHT
 * - repetative → repetitive: the second 'i' moves far - DON'T HIGHLIGHT
 * 
 * @param pairs - Array of [sourceIndex, targetIndex] pairs from the survivor mapping
 * @param maxMoveDistance - Maximum distance to consider as a "local" move (default: 1)
 * @returns Array of source indices to highlight as adjacent movers
 */
export function identifyTrueMovers(
  pairs: Array<[number, number]>,
  maxMoveDistance: number = 1
): number[] {
  // If we have 0-1 pairs, there are no true movers to identify
  if (pairs.length <= 1) {
    return [];
  }

  const highlightIndices: number[] = [];
  
  for (const [sIdx, tIdx] of pairs) {
    const moveDistance = Math.abs(tIdx - sIdx);
    // Only highlight if the character actually moves AND moves a short distance
    if (moveDistance > 0 && moveDistance <= maxMoveDistance) {
      highlightIndices.push(sIdx);
    }
  }

  return highlightIndices;
}

