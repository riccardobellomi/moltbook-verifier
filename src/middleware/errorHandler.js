import logger from '../utils/logger.js';
import config from '../config/index.js';
import { VerificationError } from '../services/verificationService.js';

/**
 * Custom API error class
 */
export class APIError extends Error {
  constructor(statusCode, message, code = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'APIError';
  }

  static badRequest(message, code = 'BAD_REQUEST') {
    return new APIError(400, message, code);
  }

  static unauthorized(message, code = 'UNAUTHORIZED') {
    return new APIError(401, message, code);
  }

  static notFound(message, code = 'NOT_FOUND') {
    return new APIError(404, message, code);
  }

  static tooManyRequests(message, code = 'RATE_LIMITED') {
    return new APIError(429, message, code);
  }

  static internal(message, code = 'INTERNAL_ERROR') {
    return new APIError(500, message, code);
  }
}

/**
 * 404 handler for unknown routes
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      'GET /challenge',
      'POST /verify',
      'GET /status',
      'GET /help',
    ],
  });
};

/**
 * Global error handler
 */
export const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error(`Error handling ${req.method} ${req.path}:`, err);

  // Handle known error types
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  if (err instanceof VerificationError) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code,
      hint: err.code === 'NO_SESSION' 
        ? 'GET /challenge first to receive a keyword'
        : 'GET /challenge for a new keyword',
    });
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      hint: 'Check your request body is valid JSON',
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = config.isProduction 
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.isProduction ? {} : { stack: err.stack }),
  });
};

/**
 * Async handler wrapper to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
