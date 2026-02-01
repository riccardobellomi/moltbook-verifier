import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Session data structure
 * @typedef {Object} Session
 * @property {string} keyword - The challenge keyword
 * @property {number} issuedAt - Timestamp when challenge was issued
 * @property {boolean} verified - Whether verification passed
 * @property {number} attempts - Number of verification attempts
 */

class SessionService {
  constructor() {
    /** @type {Map<string, Session>} */
    this.sessions = new Map();
    
    // Cleanup expired sessions periodically
    this.cleanupInterval = setInterval(
      () => this.cleanupExpiredSessions(),
      60000 // Every minute
    );
  }

  /**
   * Create a new session for an IP
   * @param {string} ip - Client IP address
   * @param {string} keyword - Challenge keyword
   * @returns {Session}
   */
  createSession(ip, keyword) {
    const session = {
      keyword,
      issuedAt: Date.now(),
      verified: false,
      attempts: 0,
    };
    
    this.sessions.set(ip, session);
    logger.debug(`Session created for ${ip}: keyword="${keyword}"`);
    
    return session;
  }

  /**
   * Get session for an IP
   * @param {string} ip - Client IP address
   * @returns {Session|null}
   */
  getSession(ip) {
    return this.sessions.get(ip) || null;
  }

  /**
   * Check if session is expired
   * @param {Session} session
   * @returns {boolean}
   */
  isExpired(session) {
    const elapsed = (Date.now() - session.issuedAt) / 1000;
    return elapsed > config.challenge.timeoutSeconds;
  }

  /**
   * Get elapsed time for session
   * @param {Session} session
   * @returns {number} Elapsed time in seconds
   */
  getElapsedSeconds(session) {
    return Math.round((Date.now() - session.issuedAt) / 1000 * 100) / 100;
  }

  /**
   * Increment attempt counter
   * @param {string} ip
   */
  incrementAttempts(ip) {
    const session = this.sessions.get(ip);
    if (session) {
      session.attempts++;
    }
  }

  /**
   * Mark session as verified
   * @param {string} ip
   */
  markVerified(ip) {
    const session = this.sessions.get(ip);
    if (session) {
      session.verified = true;
    }
  }

  /**
   * Delete session
   * @param {string} ip
   */
  deleteSession(ip) {
    this.sessions.delete(ip);
    logger.debug(`Session deleted for ${ip}`);
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    let cleaned = 0;
    for (const [ip, session] of this.sessions) {
      if (this.isExpired(session)) {
        this.sessions.delete(ip);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} expired sessions`);
    }
  }

  /**
   * Get active session count
   * @returns {number}
   */
  getActiveCount() {
    return this.sessions.size;
  }

  /**
   * Shutdown cleanup
   */
  shutdown() {
    clearInterval(this.cleanupInterval);
  }
}

// Export singleton instance
export default new SessionService();
