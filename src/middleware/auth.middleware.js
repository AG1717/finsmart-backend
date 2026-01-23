import { verifyAccessToken } from '../utils/jwt.util.js';
import { errorResponse } from '../utils/response.util.js';
import { ERROR_MESSAGES } from '../utils/constants.js';
import User from '../models/User.model.js';

/**
 * Middleware pour protéger les routes authentifiées
 * Vérifie la présence et la validité du token JWT dans le header Authorization
 */
export const protect = async (req, res, next) => {
  try {
    // 1. Vérifier la présence du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        res,
        'No authentication token provided. Please login.',
        401
      );
    }

    // 2. Extraire le token
    const token = authHeader.substring(7); // Enlever "Bearer "

    if (!token) {
      return errorResponse(
        res,
        'No authentication token provided. Please login.',
        401
      );
    }

    // 3. Vérifier le token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      if (error.message.includes('expired')) {
        return errorResponse(
          res,
          ERROR_MESSAGES.TOKEN_EXPIRED,
          401,
          { code: 'TOKEN_EXPIRED' }
        );
      }
      return errorResponse(
        res,
        ERROR_MESSAGES.TOKEN_INVALID,
        401,
        { code: 'TOKEN_INVALID' }
      );
    }

    // 4. Vérifier que l'utilisateur existe toujours
    const user = await User.findById(decoded.id).select('-password -refreshTokens');

    if (!user) {
      return errorResponse(
        res,
        'User no longer exists. Please login again.',
        401
      );
    }

    // 5. Attacher l'utilisateur à la requête
    req.user = user;
    req.userId = user._id.toString();

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return errorResponse(
      res,
      ERROR_MESSAGES.UNAUTHORIZED,
      401
    );
  }
};

/**
 * Middleware optionnel pour obtenir l'utilisateur si le token est présent
 * mais ne pas bloquer si absent
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      if (token) {
        try {
          const decoded = verifyAccessToken(token);
          const user = await User.findById(decoded.id).select('-password -refreshTokens');

          if (user) {
            req.user = user;
            req.userId = user._id.toString();
          }
        } catch (error) {
          // Ignorer les erreurs de token pour l'auth optionnelle
        }
      }
    }

    next();
  } catch (error) {
    // En cas d'erreur, continuer sans utilisateur
    next();
  }
};
