import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator.js';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Rafraîchir le token d'accès
 * @access  Public
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Déconnexion de l'utilisateur
 * @access  Private
 */
router.post(
  '/logout',
  protect,
  authController.logout
);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Déconnexion de tous les appareils
 * @access  Private
 */
router.post(
  '/logout-all',
  protect,
  authController.logoutAll
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Demander un code de réinitialisation
 * @access  Public
 */
router.post(
  '/forgot-password',
  authLimiter,
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Réinitialiser le mot de passe avec le code
 * @access  Public
 */
router.post(
  '/reset-password',
  authLimiter,
  authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/admin-login
 * @desc    Connexion admin avec auto-promotion
 * @access  Public
 */
router.post(
  '/admin-login',
  authLimiter,
  validate(loginSchema),
  authController.adminLogin
);

export default router;
