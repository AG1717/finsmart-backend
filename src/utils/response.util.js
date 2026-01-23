/**
 * Réponse de succès standardisée
 * @param {Object} res - Objet response Express
 * @param {Object} data - Données à retourner
 * @param {String} message - Message optionnel
 * @param {Number} statusCode - Code HTTP (par défaut 200)
 */
export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Réponse d'erreur standardisée
 * @param {Object} res - Objet response Express
 * @param {String} message - Message d'erreur
 * @param {Number} statusCode - Code HTTP (par défaut 500)
 * @param {Object} details - Détails additionnels de l'erreur
 */
export const errorResponse = (res, message = 'Internal server error', statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: {
      message,
      code: getErrorCode(statusCode)
    }
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Réponse de validation d'erreur
 * @param {Object} res - Objet response Express
 * @param {Array} errors - Liste des erreurs de validation
 */
export const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors
    }
  });
};

/**
 * Obtenir le code d'erreur basé sur le status code
 * @param {Number} statusCode - Code HTTP
 * @returns {String} Code d'erreur
 */
const getErrorCode = (statusCode) => {
  const errorCodes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE'
  };

  return errorCodes[statusCode] || 'UNKNOWN_ERROR';
};
