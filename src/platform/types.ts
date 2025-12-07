/**
 * Platform abstraction interface
 * Allows the app to run on multiple platforms (Chrome extension, Tauri, etc.)
 * by providing a consistent API for platform-specific features.
 */

export interface Platform {
  /**
   * Clipboard operations
   */
  clipboard: {
    /**
     * Read text from the system clipboard
     */
    readText(): Promise<string>;

    /**
     * Write text to the system clipboard
     */
    writeText(text: string): Promise<void>;
  };

  /**
   * Persistent storage operations
   */
  storage: {
    /**
     * Get a value from storage
     */
    get<T>(key: string): Promise<T | null>;

    /**
     * Set a value in storage
     */
    set<T>(key: string, value: T): Promise<void>;
  };
}
