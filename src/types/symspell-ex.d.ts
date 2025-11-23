declare module 'symspell-ex' {
  export interface SuggestionResult {
    suggestion: string;
    frequency: number;
  }

  export class MemoryStore {}

  export class SymSpellEx {
    constructor(store: MemoryStore);
    initialize(): Promise<void>;
    add(word: string, frequency: number, language: string): Promise<void>;
    search(
      term: string,
      language: string,
      maxDistance: number,
      maxSuggestions: number
    ): Promise<SuggestionResult[]>;
  }
}
