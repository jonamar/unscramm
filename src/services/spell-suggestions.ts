export interface Suggestion {
  word: string;
  frequency: number;
}

/**
 * Spell suggestion service using a local frequency dictionary.
 * Loads dictionary lazily on first use.
 */
class SpellSuggestionService {
  private entries: Array<{ word: string; frequency: number; length: number }> = [];
  private entriesByLength = new Map<number, Array<{ word: string; frequency: number; length: number }>>();
  private frequencyMap = new Map<string, number>();
  private loading = false;
  private loaded = false;
  private loadError: Error | null = null;

  /**
   * Initialize SymSpell with frequency dictionary.
   * Safe to call multiple times - only loads once.
   */
  async initialize(): Promise<void> {
    if (this.loaded) return;
    if (this.loading) {
      // Wait for existing load to complete
      while (this.loading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.loading = true;
    try {
      const response = await fetch('/frequency-dictionary.txt');
      if (!response.ok) {
        throw new Error('Failed to load dictionary');
      }

      const text = await response.text();
      const lines = text.split('\n');

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length === 2) {
          const word = parts[0].toLowerCase();
          const frequency = parseInt(parts[1], 10) || 1;
          const entry = { word, frequency, length: word.length };
          this.entries.push(entry);
          this.frequencyMap.set(word, frequency);

          const group = this.entriesByLength.get(entry.length) ?? [];
          group.push(entry);
          this.entriesByLength.set(entry.length, group);
        }
      }

      this.loaded = true;
      this.loadError = null;
    } catch (error) {
      this.loadError = error as Error;
      throw error;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Check if service is ready to use
   */
  isReady(): boolean {
    return this.loaded;
  }

  /**
   * Check if service is currently loading
   */
  isLoading(): boolean {
    return this.loading;
  }

  /**
   * Get any load error
   */
  getError(): Error | null {
    return this.loadError;
  }

  /**
   * Normalize input: trim, lowercase, strip leading/trailing punctuation
   */
  private normalizeWord(word: string): string {
    return word
      .trim()
      .toLowerCase()
      .replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');
  }

  /**
   * Get spell suggestions for a word.
   * Returns top 4 suggestions ordered by frequency.
   *
   * @param word - Word to get suggestions for
   * @returns Array of suggestions (empty if no suggestions or not loaded)
   */
  async getSuggestions(word: string): Promise<Suggestion[]> {
    if (!this.isReady()) {
      return [];
    }

    const normalized = this.normalizeWord(word);
    if (!normalized) {
      return [];
    }

    const suggestions = this.calculateSuggestions(normalized);
    return suggestions;
  }

  private getCandidateEntries(length: number): Array<{ word: string; frequency: number; length: number }> {
    const candidates: Array<{ word: string; frequency: number; length: number }> = [];
    for (let delta = -2; delta <= 2; delta++) {
      const bucket = this.entriesByLength.get(length + delta);
      if (bucket) {
        candidates.push(...bucket);
      }
    }
    return candidates.length > 0 ? candidates : this.entries;
  }

  private calculateSuggestions(word: string): Suggestion[] {
    const exactFreq = this.frequencyMap.get(word);
    const candidates = this.getCandidateEntries(word.length);

    const scored = candidates
      .map((entry) => ({
        entry,
        distance: this.damerauLevenshtein(word, entry.word),
      }))
      .filter((item) => item.distance <= 2 || this.firstCharMatches(item.entry.word, word));

    scored.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return b.entry.frequency - a.entry.frequency;
    });

    const top = scored.slice(0, 4).map((item) => ({
      word: item.entry.word,
      frequency: item.entry.frequency,
    }));

    if (exactFreq && !top.some((s) => s.word === word)) {
      top.unshift({ word, frequency: exactFreq });
    }

    return top.slice(0, 4);
  }

  private damerauLevenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );

        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
        }
      }
    }

    return dp[m][n];
  }

  private firstCharMatches(candidate: string, word: string): boolean {
    if (!candidate || !word) return false;
    return candidate[0] === word[0];
  }
}

// Singleton instance
export const spellService = new SpellSuggestionService();
