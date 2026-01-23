import { errorResponse } from '../utils/response.util.js';
import logger from '../config/logger.js';

/**
 * Middleware pour vérifier que l'utilisateur est admin
 * Doit être utilisé APRÈS le middleware protect (auth)
 */
export const requireAdmin = (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
      logger.warn('Admin middleware: No user found in request');
      return errorResponse(res, 'Authentication required', 401);
    }

    // Vérifier si l'utilisateur a le rôle admin
    if (req.user.role !== 'admin') {
      logger.warn(`Admin access denied for user: ${req.user.id} (role: ${req.user.role})`);
      return errorResponse(res, 'Admin access required. This action is restricted to administrators only.', 403);
    }

    // L'utilisateur est admin, continuer
    logger.debug(`Admin access granted for user: ${req.user.id}`);
    next();
  } catch (error) {
    logger.error('Error in admin middleware:', error);
    return errorResponse(res, 'Error checking admin status', 500);
  }
};
