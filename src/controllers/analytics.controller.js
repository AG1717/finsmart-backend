import Analytics from '../models/Analytics.model.js';
import User from '../models/User.model.js';
import Goal from '../models/Goal.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';
import logger from '../config/logger.js';

/**
 * Enregistrer un événement analytics
 */
export const trackEvent = async (req, res) => {
  try {
    const { eventType, eventData, metadata } = req.body;
    const userId = req.user.id;

    const event = await Analytics.create({
      userId,
      eventType,
      eventData: eventData || {},
      metadata: metadata || {}
    });

    logger.info(`Analytics event tracked: ${eventType} for user ${userId}`);
    return successResponse(res, { event }, 'Event tracked successfully', 201);
  } catch (error) {
    logger.error('Error tracking analytics event:', error);
    return errorResponse(res, 'Failed to track event', 500);
  }
};

/**
 * Obtenir les métriques globales (admin uniquement)
 */
export const getMetrics = async (req, res) => {
  try {
    const { startDate, endDate, period = '7days' } = req.query;

    // Calculer la date de début selon la période
    let start = new Date();
    if (period === '7days') {
      start.setDate(start.getDate() - 7);
    } else if (period === '30days') {
      start.setDate(start.getDate() - 30);
    } else if (period === '90days') {
      start.setDate(start.getDate() - 90);
    } else if (startDate) {
      start = new Date(startDate);
    }

    const end = endDate ? new Date(endDate) : new Date();

    // 1. Nombre total d'utilisateurs
    const totalUsers = await User.countDocuments();

    // 2. Nouveaux utilisateurs dans la période
    const newUsers = await User.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // 3. Utilisateurs qui ont créé au moins un objectif dans les 7 premiers jours
    const usersWithGoalsIn7Days = await Analytics.aggregate([
      {
        $match: {
          eventType: 'user_registered',
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $lookup: {
          from: 'analytics',
          let: { userId: '$userId', registrationDate: '$timestamp' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $eq: ['$eventType', 'goal_created'] },
                    { $gte: ['$timestamp', '$$registrationDate'] },
                    { $lte: ['$timestamp', { $add: ['$$registrationDate', 7 * 24 * 60 * 60 * 1000] }] }
                  ]
                }
              }
            }
          ],
          as: 'goalsCreated'
        }
      },
      {
        $match: {
          'goalsCreated.0': { $exists: true }
        }
      },
      {
        $count: 'count'
      }
    ]);

    const usersWithGoals = usersWithGoalsIn7Days[0]?.count || 0;
    const goalsCreationRate = newUsers > 0 ? ((usersWithGoals / newUsers) * 100).toFixed(2) : 0;

    // 4. Taux de rétention à 7 jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usersRegistered7DaysAgo = await User.countDocuments({
      createdAt: { $gte: new Date(sevenDaysAgo.getTime() - 24 * 60 * 60 * 1000), $lte: sevenDaysAgo }
    });

    const activeUsers7DaysLater = await Analytics.distinct('userId', {
      eventType: 'app_opened',
      timestamp: { $gte: sevenDaysAgo, $lte: new Date() }
    });

    const retentionRate = usersRegistered7DaysAgo > 0
      ? ((activeUsers7DaysLater.length / usersRegistered7DaysAgo) * 100).toFixed(2)
      : 0;

    // 5. Objectifs créés vs complétés
    const totalGoals = await Goal.countDocuments();
    const completedGoals = await Goal.countDocuments({ status: 'completed' });
    const activeGoals = await Goal.countDocuments({ status: 'active' });

    // 6. Taux de succès des objectifs
    const goalSuccessRate = totalGoals > 0 ? ((completedGoals / totalGoals) * 100).toFixed(2) : 0;

    // 7. Événements par type dans la période
    const eventsByType = await Analytics.aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // 8. Utilisateurs actifs quotidiens (DAU)
    const last7DaysDAU = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const dailyActiveUsers = await Analytics.distinct('userId', {
        eventType: 'app_opened',
        timestamp: { $gte: day, $lt: nextDay }
      });

      last7DaysDAU.push({
        date: day.toISOString().split('T')[0],
        count: dailyActiveUsers.length
      });
    }

    // 9. Utilisation hebdomadaire moyenne
    const weeklyActiveUsers = await Analytics.distinct('userId', {
      eventType: 'app_opened',
      timestamp: { $gte: start, $lte: end }
    });

    const avgWeeklyUsage = weeklyActiveUsers.length;

    // 10. Répartition des objectifs par catégorie
    const goalsByCategory = await Goal.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalTarget: { $sum: '$amounts.target' },
          totalCurrent: { $sum: '$amounts.current' }
        }
      }
    ]);

    // 11. Répartition court terme vs long terme
    const goalsByTimeframe = await Goal.aggregate([
      {
        $group: {
          _id: '$timeframe',
          count: { $sum: 1 }
        }
      }
    ]);

    const metrics = {
      overview: {
        totalUsers,
        newUsers,
        totalGoals,
        completedGoals,
        activeGoals
      },
      successMetrics: {
        goalsCreationRate: `${goalsCreationRate}%`,
        usersWithGoalsIn7Days: usersWithGoals,
        retentionRate: `${retentionRate}%`,
        goalSuccessRate: `${goalSuccessRate}%`,
        avgWeeklyUsage
      },
      dailyActiveUsers: last7DaysDAU,
      eventsByType: eventsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      goalDistribution: {
        byCategory: goalsByCategory,
        byTimeframe: goalsByTimeframe
      },
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        periodName: period
      }
    };

    return successResponse(res, metrics, 'Metrics retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving metrics:', error);
    return errorResponse(res, 'Failed to retrieve metrics', 500);
  }
};

/**
 * Obtenir les événements d'un utilisateur spécifique
 */
export const getUserEvents = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { limit = 50, eventType } = req.query;

    const query = { userId };
    if (eventType) {
      query.eventType = eventType;
    }

    const events = await Analytics.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    return successResponse(res, { events }, 'User events retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving user events:', error);
    return errorResponse(res, 'Failed to retrieve user events', 500);
  }
};

/**
 * Obtenir les statistiques d'utilisation par heure (pour identifier les pics d'activité)
 */
export const getUsagePatterns = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const hourlyUsage = await Analytics.aggregate([
      {
        $match: {
          eventType: 'app_opened',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    const formattedUsage = Array.from({ length: 24 }, (_, i) => {
      const hourData = hourlyUsage.find(h => h._id === i);
      return {
        hour: i,
        count: hourData ? hourData.count : 0
      };
    });

    return successResponse(res, { hourlyUsage: formattedUsage }, 'Usage patterns retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving usage patterns:', error);
    return errorResponse(res, 'Failed to retrieve usage patterns', 500);
  }
};
