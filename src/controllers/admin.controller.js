import User from '../models/User.model.js';
import Goal from '../models/Goal.model.js';
import Analytics from '../models/Analytics.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';
import logger from '../config/logger.js';
import NotificationService from '../services/notification.service.js';

/**
 * @desc    Obtenir tous les utilisateurs (avec pagination et filtres)
 * @route   GET /api/v1/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, sortBy = 'createdAt', order = 'desc' } = req.query;

    // Construction du filtre de recherche
    const filter = {};

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      filter.role = role;
    }

    // Tri
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Récupérer les utilisateurs
    const users = await User.find(filter)
      .select('-refreshTokens')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Compter le total
    const total = await User.countDocuments(filter);

    // Pour chaque utilisateur, obtenir les statistiques de ses objectifs
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const goalsCount = await Goal.countDocuments({ userId: user._id });
      const completedGoals = await Goal.countDocuments({
        userId: user._id,
        status: 'completed'
      });
      const activeGoals = await Goal.countDocuments({
        userId: user._id,
        status: 'active'
      });

      // Calculer le total épargné
      const goals = await Goal.find({ userId: user._id });
      const totalSaved = goals.reduce((sum, goal) => sum + (goal.amounts?.current || 0), 0);
      const totalTarget = goals.reduce((sum, goal) => sum + (goal.amounts?.target || 0), 0);

      return {
        ...user.toJSON(),
        stats: {
          totalGoals: goalsCount,
          completedGoals,
          activeGoals,
          totalSaved,
          totalTarget
        }
      };
    }));

    return successResponse(res, {
      users: usersWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        limit: parseInt(limit)
      }
    }, 'Users retrieved successfully');

  } catch (error) {
    logger.error('Error getting all users:', error);
    return errorResponse(res, 'Error retrieving users', 500);
  }
};

/**
 * @desc    Obtenir un utilisateur spécifique avec tous ses détails
 * @route   GET /api/v1/admin/users/:userId
 * @access  Private/Admin
 */
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-refreshTokens');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Récupérer tous les objectifs de l'utilisateur
    const goals = await Goal.find({ userId });

    // Récupérer les événements analytics
    const events = await Analytics.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Statistiques
    const stats = {
      totalGoals: goals.length,
      completedGoals: goals.filter(g => g.status === 'completed').length,
      activeGoals: goals.filter(g => g.status === 'active').length,
      pausedGoals: goals.filter(g => g.status === 'paused').length,
      totalSaved: goals.reduce((sum, goal) => sum + (goal.amounts?.current || 0), 0),
      totalTarget: goals.reduce((sum, goal) => sum + (goal.amounts?.target || 0), 0),
      totalEvents: events.length
    };

    return successResponse(res, {
      user: user.toJSON(),
      goals,
      recentEvents: events,
      stats
    }, 'User details retrieved successfully');

  } catch (error) {
    logger.error('Error getting user by ID:', error);
    return errorResponse(res, 'Error retrieving user details', 500);
  }
};

/**
 * @desc    Mettre à jour un utilisateur (changer role, modifier profil, etc.)
 * @route   PUT /api/v1/admin/users/:userId
 * @access  Private/Admin
 */
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, username, email, profile, preferences } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Sauvegarder l'ancien rôle pour la notification
    const oldRole = user.role;
    const roleChanged = role && role !== oldRole;

    // Mise à jour des champs autorisés
    if (role && ['user', 'admin'].includes(role)) {
      user.role = role;
    }

    if (username) {
      user.username = username;
    }

    if (email) {
      user.email = email;
    }

    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    logger.info(`User ${userId} updated by admin ${req.user.id}`);

    // Logger l'action admin
    await NotificationService.logAdminAction(
      req.user,
      roleChanged ? (role === 'admin' ? 'user_promoted' : 'user_demoted') : 'user_updated',
      user,
      { roleChanged, oldRole, newRole: role }
    );

    return successResponse(res, {
      user: user.toJSON()
    }, 'User updated successfully');

  } catch (error) {
    logger.error('Error updating user:', error);

    // Erreur de duplication (email ou username déjà pris)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return errorResponse(res, `This ${field} is already taken`, 400);
    }

    return errorResponse(res, 'Error updating user', 500);
  }
};

/**
 * @desc    Supprimer un utilisateur et tous ses objectifs
 * @route   DELETE /api/v1/admin/users/:userId
 * @access  Private/Admin
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier que l'admin ne se supprime pas lui-même
    if (userId === req.user.id) {
      return errorResponse(res, 'You cannot delete your own account', 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Supprimer tous les objectifs de l'utilisateur
    const deletedGoals = await Goal.deleteMany({ userId });

    // Supprimer tous les événements analytics
    await Analytics.deleteMany({ userId });

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(userId);

    logger.info(`User ${userId} deleted by admin ${req.user.id}. ${deletedGoals.deletedCount} goals deleted.`);

    // Logger l'action admin
    await NotificationService.logAdminAction(
      req.user,
      'user_deleted',
      user,
      { deletedGoalsCount: deletedGoals.deletedCount }
    );

    return successResponse(res, {
      deletedUser: user.email,
      deletedGoalsCount: deletedGoals.deletedCount
    }, 'User and all associated data deleted successfully');

  } catch (error) {
    logger.error('Error deleting user:', error);
    return errorResponse(res, 'Error deleting user', 500);
  }
};

/**
 * @desc    Obtenir tous les objectifs (avec filtres et pagination)
 * @route   GET /api/v1/admin/goals
 * @access  Private/Admin
 */
export const getAllGoals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      category,
      timeframe,
      status,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Construction du filtre
    const filter = {};

    if (userId) filter.userId = userId;
    if (category) filter.category = category;
    if (timeframe) filter.timeframe = timeframe;
    if (status) filter.status = status;

    // Tri
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Récupérer les objectifs avec les infos utilisateur
    const goals = await Goal.find(filter)
      .populate('userId', 'username email profile')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Goal.countDocuments(filter);

    return successResponse(res, {
      goals,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalGoals: total,
        limit: parseInt(limit)
      }
    }, 'Goals retrieved successfully');

  } catch (error) {
    logger.error('Error getting all goals:', error);
    return errorResponse(res, 'Error retrieving goals', 500);
  }
};

/**
 * @desc    Supprimer un objectif (n'importe quel utilisateur)
 * @route   DELETE /api/v1/admin/goals/:goalId
 * @access  Private/Admin
 */
export const deleteGoal = async (req, res) => {
  try {
    const { goalId } = req.params;

    const goal = await Goal.findById(goalId);

    if (!goal) {
      return errorResponse(res, 'Goal not found', 404);
    }

    await Goal.findByIdAndDelete(goalId);

    logger.info(`Goal ${goalId} deleted by admin ${req.user.id}`);

    // Logger l'action admin
    await NotificationService.logAdminAction(
      req.user,
      'goal_deleted',
      goal
    );

    return successResponse(res, {
      deletedGoal: goal.name
    }, 'Goal deleted successfully');

  } catch (error) {
    logger.error('Error deleting goal:', error);
    return errorResponse(res, 'Error deleting goal', 500);
  }
};

/**
 * @desc    Mettre à jour un objectif (n'importe quel utilisateur)
 * @route   PUT /api/v1/admin/goals/:goalId
 * @access  Private/Admin
 */
export const updateGoal = async (req, res) => {
  try {
    const { goalId } = req.params;
    const updates = req.body;

    const goal = await Goal.findById(goalId);

    if (!goal) {
      return errorResponse(res, 'Goal not found', 404);
    }

    // Appliquer les mises à jour
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        goal[key] = updates[key];
      }
    });

    // Recalculer la progression si les montants ont changé
    if (updates.amounts) {
      const { current, target } = goal.amounts;
      goal.progress.percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
      goal.progress.lastUpdated = new Date();

      // Marquer comme complété si objectif atteint
      if (goal.progress.percentage >= 100 && goal.status === 'active') {
        goal.status = 'completed';
        goal.dates.completed = new Date();
      }
    }

    await goal.save();

    logger.info(`Goal ${goalId} updated by admin ${req.user.id}`);

    // Logger l'action admin
    await NotificationService.logAdminAction(
      req.user,
      'goal_updated',
      goal,
      { amountsChanged: !!updates.amounts, statusChanged: !!updates.status }
    );

    return successResponse(res, {
      goal
    }, 'Goal updated successfully');

  } catch (error) {
    logger.error('Error updating goal:', error);
    return errorResponse(res, 'Error updating goal', 500);
  }
};

/**
 * @desc    Obtenir les statistiques globales de la plateforme
 * @route   GET /api/v1/admin/stats
 * @access  Private/Admin
 */
export const getPlatformStats = async (req, res) => {
  try {
    // Statistiques utilisateurs
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    // Nouveaux utilisateurs (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Statistiques objectifs
    const totalGoals = await Goal.countDocuments();
    const activeGoals = await Goal.countDocuments({ status: 'active' });
    const completedGoals = await Goal.countDocuments({ status: 'completed' });
    const pausedGoals = await Goal.countDocuments({ status: 'paused' });

    // Objectifs par catégorie
    const goalsByCategory = await Goal.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Objectifs par timeframe
    const goalsByTimeframe = await Goal.aggregate([
      { $group: { _id: '$timeframe', count: { $sum: 1 } } }
    ]);

    // Montant total épargné
    const totalAmounts = await Goal.aggregate([
      {
        $group: {
          _id: null,
          totalSaved: { $sum: '$amounts.current' },
          totalTarget: { $sum: '$amounts.target' }
        }
      }
    ]);

    // Événements analytics (7 derniers jours)
    const recentEvents = await Analytics.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    return successResponse(res, {
      users: {
        total: totalUsers,
        admins: adminUsers,
        regular: regularUsers,
        newLast7Days: newUsers
      },
      goals: {
        total: totalGoals,
        active: activeGoals,
        completed: completedGoals,
        paused: pausedGoals,
        byCategory: goalsByCategory,
        byTimeframe: goalsByTimeframe
      },
      amounts: totalAmounts[0] || { totalSaved: 0, totalTarget: 0 },
      analytics: {
        eventsLast7Days: recentEvents
      }
    }, 'Platform statistics retrieved successfully');

  } catch (error) {
    logger.error('Error getting platform stats:', error);
    return errorResponse(res, 'Error retrieving platform statistics', 500);
  }
};
