import { asyncHandler } from '../middleware/error.middleware.js';
import { successResponse } from '../utils/response.util.js';
import * as goalService from '../services/goal.service.js';
import NotificationService from '../services/notification.service.js';
import Goal from '../models/Goal.model.js';
import logger from '../config/logger.js';

/**
 * @desc    Créer un nouvel objectif
 * @route   POST /api/v1/goals
 * @access  Private
 */
export const createGoal = asyncHandler(async (req, res) => {
  logger.info(`[GOAL CREATE] User ${req.userId} creating goal: ${JSON.stringify(req.body)}`);

  const goal = await goalService.createGoal(req.userId, req.body);
  logger.info(`[GOAL CREATE] Goal created successfully: ${goal._id} - "${goal.name}"`);

  // Vérifier si c'est le premier objectif de l'utilisateur
  const userGoalsCount = await Goal.countDocuments({ userId: req.userId });
  logger.info(`[GOAL CREATE] User ${req.userId} now has ${userGoalsCount} goals`);

  if (userGoalsCount === 1) {
    // Premier objectif
    logger.info(`[GOAL CREATE] First goal for user, triggering notification`);
    await NotificationService.notifyFirstGoal(req.user, goal);
  }

  // Notifier si c'est un objectif de grande valeur
  await NotificationService.notifyHighValueGoal(req.user, goal);

  // Vérifier les milestones (5 objectifs, 10 objectifs, etc.)
  if (userGoalsCount === 5) {
    logger.info(`[GOAL CREATE] User reached 5 goals milestone`);
    await NotificationService.notifyUserMilestone(req.user, '5_goals');
  } else if (userGoalsCount === 10) {
    logger.info(`[GOAL CREATE] User reached 10 goals milestone`);
    await NotificationService.notifyUserMilestone(req.user, '10_goals');
  }

  successResponse(
    res,
    { goal },
    'Goal created successfully',
    201
  );
});

/**
 * @desc    Obtenir tous les objectifs de l'utilisateur
 * @route   GET /api/v1/goals
 * @access  Private
 */
export const getGoals = asyncHandler(async (req, res) => {
  const result = await goalService.getUserGoals(req.userId, req.query);

  successResponse(
    res,
    result,
    'Goals retrieved successfully'
  );
});

/**
 * @desc    Obtenir un objectif par ID
 * @route   GET /api/v1/goals/:id
 * @access  Private
 */
export const getGoalById = asyncHandler(async (req, res) => {
  const goal = await goalService.getGoalById(req.params.id, req.userId);

  successResponse(
    res,
    { goal },
    'Goal retrieved successfully'
  );
});

/**
 * @desc    Mettre à jour un objectif
 * @route   PUT /api/v1/goals/:id
 * @access  Private
 */
export const updateGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.updateGoal(req.params.id, req.userId, req.body);

  // Vérifier si l'objectif vient d'être complété
  if (goal.status === 'completed' && goal.dates.completed) {
    const completedRecently = new Date(goal.dates.completed) > new Date(Date.now() - 60000); // Dans la dernière minute
    if (completedRecently) {
      await NotificationService.notifyGoalCompleted(req.user, goal);

      // Vérifier les milestones de completion
      const completedCount = await Goal.countDocuments({
        userId: req.userId,
        status: 'completed'
      });
      if (completedCount === 1) {
        await NotificationService.notifyUserMilestone(req.user, 'first_completion');
      } else if (completedCount === 5) {
        await NotificationService.notifyUserMilestone(req.user, '5_completions');
      }
    }
  }

  successResponse(
    res,
    { goal },
    'Goal updated successfully'
  );
});

/**
 * @desc    Supprimer un objectif
 * @route   DELETE /api/v1/goals/:id
 * @access  Private
 */
export const deleteGoal = asyncHandler(async (req, res) => {
  await goalService.deleteGoal(req.params.id, req.userId);

  successResponse(
    res,
    null,
    'Goal deleted successfully'
  );
});

/**
 * @desc    Supprimer tous les objectifs de l'utilisateur
 * @route   DELETE /api/v1/goals
 * @access  Private
 */
export const deleteAllGoals = asyncHandler(async (req, res) => {
  logger.info(`[GOAL DELETE ALL] User ${req.userId} deleting all goals`);

  const result = await Goal.deleteMany({ userId: req.userId });

  logger.info(`[GOAL DELETE ALL] Deleted ${result.deletedCount} goals for user ${req.userId}`);

  successResponse(
    res,
    { deletedCount: result.deletedCount },
    `All ${result.deletedCount} goals deleted successfully`
  );
});

/**
 * @desc    Ajouter une contribution à un objectif
 * @route   POST /api/v1/goals/:id/contribute
 * @access  Private
 */
export const addContribution = asyncHandler(async (req, res) => {
  const { amount, note } = req.body;
  const goal = await goalService.addContribution(req.params.id, req.userId, amount, note);

  successResponse(
    res,
    {
      goal,
      contribution: {
        amount,
        date: new Date(),
        note: note || ''
      }
    },
    'Contribution added successfully'
  );
});

/**
 * @desc    Obtenir le dashboard de l'utilisateur
 * @route   GET /api/v1/goals/dashboard
 * @access  Private
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await goalService.getDashboard(req.userId);

  successResponse(
    res,
    dashboard,
    'Dashboard data retrieved successfully'
  );
});
