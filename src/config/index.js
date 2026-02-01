import dotenv from 'dotenv';

dotenv.config();

const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Challenge
  challenge: {
    timeoutSeconds: parseInt(process.env.CHALLENGE_TIMEOUT_SECONDS, 10) || 30,
    minKeywordLength: parseInt(process.env.MIN_KEYWORD_LENGTH, 10) || 3,
    maxKeywordLength: parseInt(process.env.MAX_KEYWORD_LENGTH, 10) || 8,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // Keywords
  keywordsUrl: process.env.KEYWORDS_URL || 
    'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english.txt',
};

// Freeze to prevent accidental modification
Object.freeze(config);
Object.freeze(config.challenge);
Object.freeze(config.rateLimit);

export default config;
