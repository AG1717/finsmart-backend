import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../utils/constants.js';

/**
 * Rate limiter général pour toutes les routes
 */
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.GENERAL.windowMs,
  max: RATE_LIMITS.GENERAL.max,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again later'
    }
  },
  standardHeaders: true, // Retourner les infos de rate limit dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactiver les headers `X-RateLimit-*`
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again later',
        retryAfter: req.rateLimit.resetTime
      }
    });
  }
});

/**
 * Rate limiter strict pour les routes d'authentification
 * Protection contre les attaques par force brute
 */
export const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.windowMs,
  max: RATE_LIMITS.AUTH.max,
  skipSuccessfulRequests: true, // Ne pas compter les requêtes réussies
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_AUTH_ATTEMPTS',
      message: 'Too many authentication attempts, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_AUTH_ATTEMPTS',
        message: 'Too many authentication attempts from this IP, please try again later',
        retryAfter: req.rateLimit.resetTime
      }
    });
  }
});

/**
 * Rate limiter pour les opérations sensibles (ex: changement de mot de passe)
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 tentatives par heure
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_SENSITIVE_REQUESTS',
      message: 'Too many requests for this operation, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_SENSITIVE_REQUESTS',
        message: 'Too many requests for this operation, please try again in 1 hour',
        retryAfter: req.rateLimit.resetTime
      }
    });
  }
});
