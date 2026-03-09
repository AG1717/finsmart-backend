import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../utils/constants.js';

/**
 * General limiter for all API routes.
 */
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.GENERAL.windowMs,
  max: RATE_LIMITS.GENERAL.max,
  passOnStoreError: true,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again later',
        retryAfter: req.rateLimit.resetTime,
      },
    });
  },
});

/**
 * Strict limiter for authentication routes.
 */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs,
  max: RATE_LIMITS.AUTH.max,
  passOnStoreError: true,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_AUTH_ATTEMPTS',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_AUTH_ATTEMPTS',
        message: 'Too many authentication attempts from this IP, please try again later',
        retryAfter: req.rateLimit.resetTime,
      },
    });
  },
});

/**
 * Limiter for sensitive operations.
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  passOnStoreError: true,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_SENSITIVE_REQUESTS',
      message: 'Too many requests for this operation, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_SENSITIVE_REQUESTS',
        message: 'Too many requests for this operation, please try again in 1 hour',
        retryAfter: req.rateLimit.resetTime,
      },
    });
  },
});
