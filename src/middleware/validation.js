import { body, validationResult } from 'express-validator';

/**
 * Validation rules for post verification
 */
export const verifyPostRules = [
  body('title')
    .exists({ checkFalsy: true })
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters')
    .escape(),
    
  body('content')
    .exists({ checkFalsy: true })
    .withMessage('Content is required')
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be between 1 and 10000 characters'),
    
  body('submolt')
    .optional()
    .isString()
    .withMessage('Submolt must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Submolt must be at most 100 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Submolt can only contain letters, numbers, underscores, and hyphens'),
];

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors,
    });
  }
  
  next();
};

/**
 * Sanitize output to prevent XSS
 */
export const sanitizeOutput = (obj) => {
  if (typeof obj === 'string') {
    return obj
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeOutput);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeOutput(value);
    }
    return sanitized;
  }
  
  return obj;
};
