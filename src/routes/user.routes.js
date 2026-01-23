import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
import { sensitiveLimiter } from '../middleware/rateLimit.middleware.js';
import { updateProfileSchema, changePasswordSchema } from '../validators/user.validator.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

/**
 * @route   GET /api/v1/users/me
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @access  Private
 */
router.get(
  '/me',
  userController.getProfile
);

/**
 * @route   PUT /api/v1/users/me
 * @desc    Mettre à jour le profil de l'utilisateur
 * @access  Private
 */
router.put(
  '/me',
  validate(updateProfileSchema),
  userController.updateProfile
);

/**
 * @route   PUT /api/v1/users/me/password
 * @desc    Changer le mot de passe de l'utilisateur
 * @access  Private
 */
router.put(
  '/me/password',
  sensitiveLimiter,
  validate(changePasswordSchema),
  userController.changePassword
);

export default router;
