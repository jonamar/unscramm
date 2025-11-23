import { SymSpellEx, MemoryStore } from 'symspell-ex';

export interface Suggestion {
  word: string;
  frequency: number;
}

/**
 * Spell suggestion service using SymSpell.
 * Loads dictionary lazily on first use.
 */
class SpellSuggestionService {
  private symSpell: SymSpellEx | null = null;
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
      this.symSpell = new SymSpellEx(new MemoryStore());
      await this.symSpell.initialize();

      // Load frequency dictionary
      const response = await fetch('/frequency-dictionary.txt');
      if (!response.ok) {
        throw new Error('Failed to load dictionary');
      }

      const text = await response.text();
      const lines = text.split('\n');

      // Parse and train: each line is "word frequency"
      const words: string[] = [];
      const frequencies: number[] = [];

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length === 2) {
          words.push(parts[0]);
          frequencies.push(parseInt(parts[1], 10) || 1);
        }
      }

      // Train in batches for better performance
      const batchSize = 1000;
      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize);
        const freqBatch = frequencies.slice(i, i + batchSize);

        for (let j = 0; j < batch.length; j++) {
          await this.symSpell.add(batch[j], freqBatch[j], 'en');
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
    return this.loaded && this.symSpell !== null;
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

    try {
      const results = await this.symSpell!.search(normalized, 'en', 2, 4);

      return results.map(r => ({
        word: r.suggestion,
        frequency: r.frequency
      }));
    } catch (error) {
      console.error('Spell suggestion error:', error);
      return [];
    }
  }
}

// Singleton instance
export const spellService = new SpellSuggestionService();
