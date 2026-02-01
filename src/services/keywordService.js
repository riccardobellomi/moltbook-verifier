import config from '../config/index.js';
import logger from '../utils/logger.js';

class KeywordService {
  constructor() {
    this.keywords = [];
    this.isLoaded = false;
  }

  /**
   * Fetch keywords from external source
   */
  async loadKeywords() {
    try {
      const response = await fetch(config.keywordsUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      
      this.keywords = text
        .split('\n')
        .map(k => k.trim().toLowerCase())
        .filter(k => 
          k.length >= config.challenge.minKeywordLength && 
          k.length <= config.challenge.maxKeywordLength &&
          /^[a-z]+$/.test(k) // Only alphabetic characters
        );

      this.isLoaded = true;
      logger.info(`Loaded ${this.keywords.length} keywords`);
      
      return this.keywords.length;
    } catch (error) {
      logger.error('Failed to fetch keywords:', error);
      this.loadFallbackKeywords();
      return this.keywords.length;
    }
  }

  /**
   * Load fallback keywords if external fetch fails
   */
  loadFallbackKeywords() {
    this.keywords = [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 
      'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day',
      'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new',
      'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did',
      'own', 'say', 'she', 'too', 'use', 'work', 'year', 'take'
    ];
    this.isLoaded = true;
    logger.warn(`Using ${this.keywords.length} fallback keywords`);
  }

  /**
   * Get a random keyword
   */
  getRandomKeyword() {
    if (!this.isLoaded || this.keywords.length === 0) {
      throw new Error('Keywords not loaded');
    }
    const index = Math.floor(Math.random() * this.keywords.length);
    return this.keywords[index];
  }

  /**
   * Calculate letter sum (A=1, B=2, ..., Z=26)
   */
  static letterSum(word) {
    let sum = 0;
    for (const char of word.toLowerCase()) {
      if (char >= 'a' && char <= 'z') {
        sum += char.charCodeAt(0) - 96;
      }
    }
    return sum;
  }

  /**
   * Get keyword count
   */
  getCount() {
    return this.keywords.length;
  }
}

// Export singleton instance
export default new KeywordService();
