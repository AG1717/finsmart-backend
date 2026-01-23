import logger from '../config/logger.js';
import { errorResponse } from '../utils/response.util.js';
import { ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Middleware de gestion des erreurs globales
 * Doit être le dernier middleware dans la chaîne
 */
export const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.userId || 'unauthenticated'
  });

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
  }

  // Erreur de cast MongoDB (ID invalide)
  if (err.name === 'CastError') {
    return errorResponse(
      res,
      `Invalid ${err.path}: ${err.value}`,
      400
    );
  }

  // Erreur de duplication MongoDB (clé unique)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return errorResponse(
      res,
      `A record with this ${field} already exists`,
      409
    );
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(
      res,
      ERROR_MESSAGES.TOKEN_INVALID,
      401
    );
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(
      res,
      ERROR_MESSAGES.TOKEN_EXPIRED,
      401
    );
  }

  // Erreur personnalisée avec statusCode
  if (err.statusCode) {
    return errorResponse(
      res,
      err.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      err.statusCode,
      err.details
    );
  }

  // Erreur interne du serveur (par défaut)
  return errorResponse(
    res,
    process.env.NODE_ENV === 'development'
      ? err.message
      : ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    500,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};

/**
 * Middleware pour gérer les routes non trouvées (404)
 */
export const notFoundHandler = (req, res, next) => {
  return errorResponse(
    res,
    `Route ${req.originalUrl} not found`,
    404
  );
};

/**
 * Wrapper pour les fonctions async dans les routes
 * Évite d'avoir à écrire try/catch dans chaque route
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
