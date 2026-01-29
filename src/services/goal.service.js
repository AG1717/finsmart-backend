import Goal from '../models/Goal.model.js';
import { ERROR_MESSAGES } from '../utils/constants.js';
import { PAGINATION_DEFAULTS } from '../utils/constants.js';

/**
 * Service pour créer un nouvel objectif
 */
export const createGoal = async (userId, goalData) => {
  const goal = await Goal.create({
    userId,
    ...goalData
  });

  return goal;
};

/**
 * Service pour récupérer tous les objectifs d'un utilisateur
 */
export const getUserGoals = async (userId, filters = {}) => {
  const { timeframe, category, status, page = 1, limit = 10 } = filters;

  // Construire la requête
  const query = { userId };

  if (timeframe) query.timeframe = timeframe;
  if (category) query.category = category;
  if (status) query.status = status;

  // Pagination
  const skip = (page - 1) * limit;

  // Exécuter la requête
  const [goals, total] = await Promise.all([
    Goal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Goal.countDocuments(query)
  ]);

  // Calculer la pagination
  const pagination = {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit)
  };

  // Obtenir les statistiques FILTRÉES par timeframe/category/status
  const statisticsFilters = {};
  if (timeframe) statisticsFilters.timeframe = timeframe;
  if (category) statisticsFilters.category = category;
  if (status) statisticsFilters.status = status;

  const statistics = await Goal.getUserStatistics(userId, statisticsFilters);

  return {
    goals,
    pagination,
    statistics
  };
};

/**
 * Service pour récupérer un objectif par ID
 */
export const getGoalById = async (goalId, userId) => {
  const goal = await Goal.findById(goalId);

  if (!goal) {
    throw {
      statusCode: 404,
      message: ERROR_MESSAGES.GOAL_NOT_FOUND
    };
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (goal.userId.toString() !== userId) {
    throw {
      statusCode: 403,
      message: ERROR_MESSAGES.GOAL_NOT_AUTHORIZED
    };
  }

  return goal;
};

/**
 * Service pour mettre à jour un objectif
 */
export const updateGoal = async (goalId, userId, updateData) => {
  const goal = await Goal.findById(goalId);

  if (!goal) {
    throw {
      statusCode: 404,
      message: ERROR_MESSAGES.GOAL_NOT_FOUND
    };
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (goal.userId.toString() !== userId) {
    throw {
      statusCode: 403,
      message: ERROR_MESSAGES.GOAL_NOT_AUTHORIZED
    };
  }

  // Mettre à jour les champs
  Object.keys(updateData).forEach(key => {
    if (key === 'amounts' && updateData.amounts) {
      // Mettre à jour amounts de manière imbriquée
      if (updateData.amounts.current !== undefined) {
        goal.amounts.current = updateData.amounts.current;
      }
      if (updateData.amounts.target !== undefined) {
        goal.amounts.target = updateData.amounts.target;
      }
      if (updateData.amounts.currency) {
        goal.amounts.currency = updateData.amounts.currency;
      }
    } else if (key === 'dates' && updateData.dates) {
      // Mettre à jour dates de manière imbriquée
      if (updateData.dates.target !== undefined) {
        goal.dates.target = updateData.dates.target;
      }
    } else {
      goal[key] = updateData[key];
    }
  });

  await goal.save();

  return goal;
};

/**
 * Service pour supprimer un objectif
 */
export const deleteGoal = async (goalId, userId) => {
  const goal = await Goal.findById(goalId);

  if (!goal) {
    throw {
      statusCode: 404,
      message: ERROR_MESSAGES.GOAL_NOT_FOUND
    };
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (goal.userId.toString() !== userId) {
    throw {
      statusCode: 403,
      message: ERROR_MESSAGES.GOAL_NOT_AUTHORIZED
    };
  }

  await goal.deleteOne();

  return { message: 'Goal deleted successfully' };
};

/**
 * Service pour ajouter une contribution à un objectif
 */
export const addContribution = async (goalId, userId, amount, note) => {
  const goal = await Goal.findById(goalId);

  if (!goal) {
    throw {
      statusCode: 404,
      message: ERROR_MESSAGES.GOAL_NOT_FOUND
    };
  }

  // Vérifier que l'objectif appartient à l'utilisateur
  if (goal.userId.toString() !== userId) {
    throw {
      statusCode: 403,
      message: ERROR_MESSAGES.GOAL_NOT_AUTHORIZED
    };
  }

  // Ajouter la contribution
  await goal.addContribution(amount, note);

  return goal;
};

/**
 * Service pour obtenir le dashboard de l'utilisateur
 */
export const getDashboard = async (userId) => {
  // Obtenir toutes les statistiques
  const statistics = await Goal.getUserStatistics(userId);

  // Obtenir les objectifs récents (5 derniers)
  const recentGoals = await Goal.find({ userId, status: 'active' })
    .sort({ createdAt: -1 })
    .limit(5);

  // Obtenir les objectifs proches de la complétion (>= 80%)
  const goals = await Goal.find({ userId, status: 'active' });
  const nearCompletion = goals
    .filter(g => g.progress.percentage >= 80)
    .sort((a, b) => b.progress.percentage - a.progress.percentage)
    .slice(0, 5);

  return {
    overview: {
      totalGoals: statistics.totalGoals,
      activeGoals: statistics.activeGoals,
      completedGoals: statistics.completedGoals,
      totalTargetAmount: statistics.totalTargetAmount,
      totalCurrentAmount: statistics.totalCurrentAmount,
      overallProgress: statistics.overallProgress
    },
    byTimeframe: statistics.byTimeframe,
    byCategory: statistics.byCategory,
    recentGoals,
    nearCompletion
  };
};
