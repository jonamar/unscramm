/**
 * Represents a mapped letter with source and target indices.
 */
interface MappedLetter {
  fromIndex: number;
  toIndex: number;
  char: string;
}

/**
 * Represents the mapping between surviving letters from source to target positions.
 */
export interface SurvivorMapping {
  /** Mapped letters with source index, target index, and character */
  mappedLetters: MappedLetter[];
  /** Map from target index to source index for surviving characters */
  targetToSourceMap: Map<number, number>;
}

/**
 * Computes which letters survive (not deleted) and maps them to their target positions.
 *
 * Uses a greedy algorithm to match surviving source letters to target positions:
 * - For each position in the target word, find the next unused survivor with the same character
 * - This creates a stable mapping for animation purposes
 *
 * @param source - The source word
 * @param target - The target word
 * @param deletions - Array of source indices that will be deleted
 * @returns Mapping of surviving letters and their target positions
 */
export function computeSurvivorMapping(
  source: string,
  target: string,
  deletions: number[]
): SurvivorMapping {
  // Build survivors (source indices not deleted)
  const survivors: number[] = [];
  for (let i = 0; i < source.length; i++) {
    if (!deletions.includes(i)) survivors.push(i);
  }

  // Greedy map target positions to next unused survivor with same char
  const used = new Set<number>();
  const mapped: { fromIndex: number; toIndex: number; char: string }[] = [];
  const t2s = new Map<number, number>(); // target index -> source index

  for (let t = 0; t < target.length; t++) {
    const c = target[t];
    let found = -1;
    for (const sIdx of survivors) {
      if (!used.has(sIdx) && source[sIdx] === c) {
        found = sIdx;
        break;
      }
    }
    if (found >= 0) {
      used.add(found);
      mapped.push({ fromIndex: found, toIndex: t, char: c });
      t2s.set(t, found);
    }
  }

  mapped.sort((a, b) => a.toIndex - b.toIndex);

  return { mappedLetters: mapped, targetToSourceMap: t2s };
}
