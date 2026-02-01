import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Helmet middleware for security headers
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/**
 * CORS middleware
 */
export const corsMiddleware = cors({
  origin: config.isProduction 
    ? process.env.ALLOWED_ORIGINS?.split(',') || false
    : true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
});

/**
 * Rate limiter middleware
 */
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests',
    hint: 'Please wait before making more requests',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for ${req.ip}`);
    res.status(429).json(options.message);
  },
});

/**
 * Request size limiter
 */
export const requestSizeLimiter = (limit = '10kb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxBytes = parseSize(limit);
    
    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        error: 'Request too large',
        maxSize: limit,
      });
    }
    next();
  };
};

/**
 * Parse size string to bytes
 */
function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb)?$/);
  if (!match) return 10240; // Default 10kb
  const num = parseInt(match[1], 10);
  const unit = match[2] || 'b';
  return num * units[unit];
}
