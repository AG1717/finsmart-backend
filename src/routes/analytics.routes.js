import express from 'express';
import { trackEvent, getMetrics, getUserEvents, getUsagePatterns } from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import Joi from 'joi';

const router = express.Router();

// Schéma de validation pour trackEvent
const trackEventSchema = Joi.object({
  eventType: Joi.string()
    .valid(
      'user_registered',
      'user_login',
      'goal_created',
      'goal_updated',
      'goal_deleted',
      'goal_completed',
      'contribution_added',
      'profile_updated',
      'app_opened',
      'language_changed',
      'currency_changed'
    )
    .required(),
  eventData: Joi.object().optional(),
  metadata: Joi.object({
    deviceType: Joi.string().optional(),
    appVersion: Joi.string().optional(),
    platform: Joi.string().optional()
  }).optional()
});

/**
 * @route   POST /api/v1/analytics/track
 * @desc    Enregistrer un événement analytics
 * @access  Private
 */
router.post('/track', protect, validate(trackEventSchema), trackEvent);

/**
 * @route   GET /api/v1/analytics/metrics
 * @desc    Obtenir les métriques globales (tous les utilisateurs peuvent voir)
 * @access  Private
 */
router.get('/metrics', protect, getMetrics);

/**
 * @route   GET /api/v1/analytics/events
 * @desc    Obtenir les événements de l'utilisateur connecté
 * @access  Private
 */
router.get('/events', protect, getUserEvents);

/**
 * @route   GET /api/v1/analytics/events/:userId
 * @desc    Obtenir les événements d'un utilisateur spécifique
 * @access  Private
 */
router.get('/events/:userId', protect, getUserEvents);

/**
 * @route   GET /api/v1/analytics/usage-patterns
 * @desc    Obtenir les patterns d'utilisation par heure
 * @access  Private
 */
router.get('/usage-patterns', protect, getUsagePatterns);

export default router;
