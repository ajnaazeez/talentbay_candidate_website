/**
 * Search History Utility for TalentBay Candidate Web
 * Matches Flutter search history implementation with 30-day retention and query timestamping.
 */

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

const STORAGE_KEY = 'talentbay_search_history';
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export const searchHistoryUtil = {
  /**
   * Loads search history from local storage, pruning entries older than 30 days.
   */
  getHistory(): SearchHistoryItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const now = Date.now();
      const validItems: SearchHistoryItem[] = [];

      for (const item of parsed) {
        if (
          item &&
          typeof item === 'object' &&
          typeof item.query === 'string' &&
          item.query.trim().length > 0 &&
          typeof item.timestamp === 'number'
        ) {
          if (now - item.timestamp <= RETENTION_MS) {
            validItems.push({
              query: item.query.trim(),
              timestamp: item.timestamp,
            });
          }
        }
      }

      // If any expired items were dropped, update local storage
      if (validItems.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validItems));
      }

      return validItems;
    } catch (err) {
      console.warn('[searchHistory] Error loading search history:', err);
      return [];
    }
  },

  /**
   * Adds or bumps a search query to the top of recent searches.
   */
  addQuery(query: string, maxItems = 10): SearchHistoryItem[] {
    const trimmed = query.trim();
    if (!trimmed || typeof window === 'undefined') return this.getHistory();

    const current = this.getHistory();
    // Remove if query already exists (case-insensitive deduplication)
    const filtered = current.filter(
      (item) => item.query.toLowerCase() !== trimmed.toLowerCase()
    );

    const updated: SearchHistoryItem[] = [
      { query: trimmed, timestamp: Date.now() },
      ...filtered,
    ].slice(0, maxItems);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[searchHistory] Error saving search query:', err);
    }

    return updated;
  },

  /**
   * Removes a specific search item from history.
   */
  removeQuery(query: string): SearchHistoryItem[] {
    if (typeof window === 'undefined') return [];
    const current = this.getHistory();
    const updated = current.filter(
      (item) => item.query.toLowerCase() !== query.trim().toLowerCase()
    );

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[searchHistory] Error removing search query:', err);
    }

    return updated;
  },

  /**
   * Completely clears all stored search history.
   */
  clearHistory(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('[searchHistory] Error clearing search history:', err);
    }
  },
};

