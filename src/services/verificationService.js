import { verifyTitle, verifyDescription } from 'ai-verification';
import keywordService from './keywordService.js';
import sessionService from './sessionService.js';
import logger from '../utils/logger.js';

/**
 * Verification result
 * @typedef {Object} VerificationResult
 * @property {boolean} isAI - Whether the post is verified as AI-generated
 * @property {boolean} titleValid - Whether title verification passed
 * @property {boolean} descriptionValid - Whether description verification passed
 * @property {number} responseTimeSeconds - Time taken to respond
 * @property {string} keyword - The keyword used for verification
 */

class VerificationService {
  /**
   * Issue a new challenge to a client
   * @param {string} ip - Client IP address
   * @returns {Object} Challenge data
   */
  issueChallenge(ip) {
    const keyword = keywordService.getRandomKeyword();
    const letterSum = keywordService.constructor.letterSum(keyword);
    
    sessionService.createSession(ip, keyword);
    
    logger.info(`Challenge issued to ${ip}: "${keyword}" (sum: ${letterSum})`);
    
    return {
      keyword,
      hint: {
        letterSum,
        length: keyword.length,
      },
    };
  }

  /**
   * Verify a post submission
   * @param {string} ip - Client IP address
   * @param {string} title - Post title
   * @param {string} content - Post content
   * @returns {VerificationResult}
   * @throws {Error} If no session or session expired
   */
  verifyPost(ip, title, content) {
    const session = sessionService.getSession(ip);
    
    if (!session) {
      throw new VerificationError('NO_SESSION', 'No active challenge. GET /challenge first.');
    }
    
    if (sessionService.isExpired(session)) {
      sessionService.deleteSession(ip);
      throw new VerificationError('EXPIRED', 'Challenge expired. GET /challenge for a new one.');
    }
    
    sessionService.incrementAttempts(ip);
    
    const keyword = session.keyword;
    const responseTime = sessionService.getElapsedSeconds(session);
    
    // Perform verification
    const titleValid = verifyTitle(keyword, title);
    const descriptionValid = verifyDescription(keyword, content);
    const isAI = titleValid && descriptionValid;
    
    // Log result
    logger.info(`Verification from ${ip}: keyword="${keyword}", title=${titleValid ? '✓' : '✗'}, desc=${descriptionValid ? '✓' : '✗'}, time=${responseTime}s, result=${isAI ? 'AI' : 'FAIL'}`);
    
    if (isAI) {
      sessionService.markVerified(ip);
    }
    
    // Clear session after verification
    sessionService.deleteSession(ip);
    
    return {
      isAI,
      titleValid,
      descriptionValid,
      responseTimeSeconds: responseTime,
      keyword,
    };
  }

  /**
   * Get session info for a client
   * @param {string} ip - Client IP address
   * @returns {Object|null}
   */
  getSessionInfo(ip) {
    const session = sessionService.getSession(ip);
    
    if (!session) return null;
    
    return {
      keyword: session.keyword,
      issuedSecondsAgo: sessionService.getElapsedSeconds(session),
      verified: session.verified,
      attempts: session.attempts,
    };
  }
}

/**
 * Custom error for verification failures
 */
export class VerificationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'VerificationError';
  }
}

// Export singleton instance
export default new VerificationService();
