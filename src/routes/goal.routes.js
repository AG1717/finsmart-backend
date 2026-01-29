import express from 'express';
import * as goalController from '../controllers/goal.controller.js';
import { validate, validateMultiple } from '../middleware/validation.middleware.js';
import { protect } from '../middleware/auth.middleware.js';
import {
  createGoalSchema,
  updateGoalSchema,
  contributeSchema,
  getGoalsQuerySchema,
  goalIdSchema
} from '../validators/goal.validator.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

/**
 * @route   GET /api/v1/goals/dashboard
 * @desc    Obtenir le dashboard de l'utilisateur
 * @access  Private
 * NOTE: Cette route doit être AVANT /:id pour éviter que "dashboard" soit interprété comme un ID
 */
router.get(
  '/dashboard',
  goalController.getDashboard
);

/**
 * @route   GET /api/v1/goals
 * @desc    Obtenir tous les objectifs de l'utilisateur
 * @access  Private
 */
router.get(
  '/',
  validate(getGoalsQuerySchema, 'query'),
  goalController.getGoals
);

/**
 * @route   POST /api/v1/goals
 * @desc    Créer un nouvel objectif
 * @access  Private
 */
router.post(
  '/',
  validate(createGoalSchema),
  goalController.createGoal
);

/**
 * @route   GET /api/v1/goals/:id
 * @desc    Obtenir un objectif par ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(goalIdSchema, 'params'),
  goalController.getGoalById
);

/**
 * @route   PUT /api/v1/goals/:id
 * @desc    Mettre à jour un objectif
 * @access  Private
 */
router.put(
  '/:id',
  validateMultiple({
    params: goalIdSchema,
    body: updateGoalSchema
  }),
  goalController.updateGoal
);

/**
 * @route   DELETE /api/v1/goals/all
 * @desc    Supprimer tous les objectifs de l'utilisateur
 * @access  Private
 * NOTE: Cette route doit être AVANT /:id pour éviter que "all" soit interprété comme un ID
 */
router.delete(
  '/all',
  goalController.deleteAllGoals
);

/**
 * @route   DELETE /api/v1/goals/:id
 * @desc    Supprimer un objectif
 * @access  Private
 */
router.delete(
  '/:id',
  validate(goalIdSchema, 'params'),
  goalController.deleteGoal
);

/**
 * @route   POST /api/v1/goals/:id/contribute
 * @desc    Ajouter une contribution à un objectif
 * @access  Private
 */
router.post(
  '/:id/contribute',
  validateMultiple({
    params: goalIdSchema,
    body: contributeSchema
  }),
  goalController.addContribution
);

export default router;
