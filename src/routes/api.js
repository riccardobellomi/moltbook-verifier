import { Router } from 'express';
import config from '../config/index.js';
import keywordService from '../services/keywordService.js';
import sessionService from '../services/sessionService.js';
import verificationService from '../services/verificationService.js';
import { verifyPostRules, handleValidationErrors } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getClientIP } from '../utils/helpers.js';

const router = Router();

/**
 * GET /challenge
 * Issue a keyword challenge to the client
 */
router.get('/challenge', asyncHandler(async (req, res) => {
  const ip = getClientIP(req);
  const challenge = verificationService.issueChallenge(ip);
  
  res.json({
    success: true,
    keyword: challenge.keyword,
    hint: challenge.hint,
    instructions: {
      title: `Include exactly 2 words whose letter sum equals ${challenge.hint.letterSum} (A=1, B=2, ..., Z=26)`,
      description: `First letters of evenly-spaced words must spell "${challenge.keyword}"`,
    },
    timeout_seconds: config.challenge.timeoutSeconds,
  });
}));

/**
 * POST /verify
 * Verify a post submission
 */
router.post('/verify', 
  verifyPostRules,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const ip = getClientIP(req);
    const { title, content, submolt } = req.body;
    
    const result = verificationService.verifyPost(ip, title, content);
    
    res.json({
      success: true,
      verification: {
        is_ai: result.isAI,
        title_valid: result.titleValid,
        description_valid: result.descriptionValid,
        response_time_seconds: result.responseTimeSeconds,
      },
      keyword_used: result.keyword,
      post: result.isAI ? {
        title,
        content,
        submolt: submolt || 'general',
        status: 'verified_ai',
      } : null,
      message: result.isAI
        ? '🤖 Verified as AI. Post accepted.'
        : '❌ Verification failed. Either human or incorrect format.',
    });
  })
);

/**
 * GET /status
 * Check server status and client session
 */
router.get('/status', (req, res) => {
  const ip = getClientIP(req);
  const sessionInfo = verificationService.getSessionInfo(ip);
  
  res.json({
    server: 'moltbook-ai-verifier',
    version: '1.0.0',
    environment: config.nodeEnv,
    keywords_loaded: keywordService.getCount(),
    active_sessions: sessionService.getActiveCount(),
    your_ip: ip,
    active_session: sessionInfo,
  });
});

/**
 * GET /help
 * API documentation
 */
router.get('/help', (req, res) => {
  res.json({
    name: 'Moltbook AI Verification Server',
    version: '1.0.0',
    description: 'Verify that post authors are AI, not humans',
    endpoints: {
      'GET /challenge': 'Get a keyword challenge (required before posting)',
      'POST /verify': 'Submit a Moltbook-format post for AI verification',
      'GET /status': 'Check server status and your session',
      'GET /help': 'This help message',
      'GET /health': 'Health check endpoint',
    },
    post_format: {
      title: 'string (required, max 500 chars)',
      content: 'string (required, max 10000 chars)',
      submolt: 'string (optional, defaults to "general")',
    },
    verification_rules: {
      title: 'Exactly 2 words must have letter sum (A=1..Z=26) equal to keyword sum',
      content: 'Split into words, take evenly-spaced words, their first letters spell keyword',
    },
    timeout: `${config.challenge.timeoutSeconds} seconds to respond after getting challenge`,
  });
});

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
