/**
 * Interface representing the result of finding the longest common subsequence (LCS)
 * between two strings.
 */
export interface LCSResult {
  /** Array of pairs [sourceIdx, targetIdx] representing matching characters */
  pairs: Array<[number, number]>;
  /** Array of indices in the source string that are part of the LCS */
  sourceIndices: number[];
  /** Array of indices in the target string that are part of the LCS */
  targetIndices: number[];
}

/**
 * Finds the positions of the longest common subsequence (LCS) between two strings.
 * 
 * The LCS is the longest sequence of characters that appear in the same relative order
 * within both strings, though not necessarily contiguously.
 * 
 * For example, in "recieve" and "receive", the LCS is "receve" and the function would
 * identify the positions of these common characters in both strings.
 * 
 * @param source - Array of characters from the source string (e.g., misspelled word)
 * @param target - Array of characters from the target string (e.g., correct word)
 * @returns Object containing pairs of matching indices and separate arrays of source and target indices
 */
export function findLCSPositions(source: string[], target: string[]): LCSResult {
  const m = source.length;
  const n = target.length;
  
  // Build the DP table where dp[i][j] represents the length of LCS of 
  // source[0...i-1] and target[0...j-1]
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));
  
  // Fill the dp table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (source[i - 1] === target[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // Walk backwards from dp[m][n] to collect the matched pairs
  const pairs: Array<[number, number]> = [];
  let i = m;
  let j = n;
  
  while (i > 0 && j > 0) {
    if (source[i - 1] === target[j - 1]) {
      // Found a match
      pairs.unshift([i - 1, j - 1]); // Add to beginning to maintain ascending order
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      // Move in the direction of the larger value
      i--;
    } else {
      j--;
    }
  }
  
  // Extract source and target indices from the pairs
  const sourceIndices = pairs.map(([sourceIdx]) => sourceIdx);
  const targetIndices = pairs.map(([, targetIdx]) => targetIdx);
  
  return {
    pairs,
    sourceIndices,
    targetIndices,
  };
}

/**
 * Helper function to find the LCS between two strings (rather than pre-split arrays).
 * Convenience wrapper around findLCSPositions.
 * 
 * @param sourceWord - The source string (e.g., misspelled word)
 * @param targetWord - The target string (e.g., correct word)
 * @returns Object containing pairs of matching indices and separate arrays of source and target indices
 */
export function findLCSPositionsFromStrings(sourceWord: string, targetWord: string): LCSResult {
  const source = sourceWord.split('');
  const target = targetWord.split('');
  return findLCSPositions(source, target);
} 