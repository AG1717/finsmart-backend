import AdminNotification from '../models/AdminNotification.model.js';
import logger from '../config/logger.js';

/**
 * Service pour gérer les notifications admin
 */
class NotificationService {
  /**
   * Créer une notification pour un nouvel utilisateur
   */
  static async notifyNewUser(user) {
    try {
      logger.info(`[NOTIFICATION] Creating notification for new user: ${user.email}`);
      const notification = await AdminNotification.createNotification({
        type: 'user_registered',
        title: '🎉 Nouvel utilisateur inscrit',
        message: `${user.username} (${user.email}) vient de s'inscrire`,
        severity: 'info',
        userId: user._id,
        metadata: {
          username: user.username,
          email: user.email,
          currency: user.preferences?.currency?.code
        }
      });
      logger.info(`[NOTIFICATION] Admin notification created: ${notification._id} - New user ${user.email}`);
    } catch (error) {
      logger.error('[NOTIFICATION] Error creating new user notification:', error);
    }
  }

  /**
   * Notification quand un utilisateur crée son premier objectif
   */
  static async notifyFirstGoal(user, goal) {
    try {
      logger.info(`[NOTIFICATION] Creating first goal notification for user: ${user.email}`);
      const notification = await AdminNotification.createNotification({
        type: 'user_first_goal',
        title: '🎯 Premier objectif créé',
        message: `${user.username} a créé son premier objectif: "${goal.name}"`,
        severity: 'success',
        userId: user._id,
        goalId: goal._id,
        metadata: {
          username: user.username,
          goalName: goal.name,
          targetAmount: goal.amounts?.target,
          currency: goal.amounts?.currency?.symbol
        }
      });
      logger.info(`[NOTIFICATION] First goal notification created: ${notification._id} for ${user.email}`);
    } catch (error) {
      logger.error('[NOTIFICATION] Error creating first goal notification:', error);
    }
  }

  /**
   * Notification quand un objectif est complété
   */
  static async notifyGoalCompleted(user, goal) {
    try {
      await AdminNotification.createNotification({
        type: 'goal_completed',
        title: '✅ Objectif atteint!',
        message: `${user.username} a atteint son objectif "${goal.name}"`,
        severity: 'success',
        userId: user._id,
        goalId: goal._id,
        metadata: {
          username: user.username,
          goalName: goal.name,
          amount: goal.amounts?.target,
          currency: goal.amounts?.currency?.symbol,
          category: goal.category,
          timeframe: goal.timeframe
        }
      });
      logger.info(`Admin notification created: Goal completed for ${user.email}`);
    } catch (error) {
      logger.error('Error creating goal completed notification:', error);
    }
  }

  /**
   * Notification pour un objectif de grande valeur
   */
  static async notifyHighValueGoal(user, goal) {
    try {
      const threshold = 10000; // Seuil pour "grande valeur"
      if (goal.amounts?.target >= threshold) {
        await AdminNotification.createNotification({
          type: 'goal_high_value',
          title: '💰 Objectif de grande valeur',
          message: `${user.username} vise ${goal.amounts.currency.symbol}${goal.amounts.target.toFixed(2)} pour "${goal.name}"`,
          severity: 'info',
          userId: user._id,
          goalId: goal._id,
          metadata: {
            username: user.username,
            goalName: goal.name,
            targetAmount: goal.amounts.target,
            currency: goal.amounts.currency.symbol
          }
        });
        logger.info(`Admin notification created: High value goal for ${user.email}`);
      }
    } catch (error) {
      logger.error('Error creating high value goal notification:', error);
    }
  }

  /**
   * Notification pour un milestone utilisateur
   */
  static async notifyUserMilestone(user, milestoneType, data) {
    try {
      let message = '';
      let metadata = { username: user.username };

      switch (milestoneType) {
        case '5_goals':
          message = `${user.username} a créé 5 objectifs! 🌟`;
          metadata.goalCount = 5;
          break;
        case '10_goals':
          message = `${user.username} a créé 10 objectifs! 🎊`;
          metadata.goalCount = 10;
          break;
        case 'first_completion':
          message = `${user.username} a complété son premier objectif! 🏆`;
          break;
        case '5_completions':
          message = `${user.username} a complété 5 objectifs! 🌟`;
          metadata.completedCount = 5;
          break;
        case 'high_saver':
          message = `${user.username} a épargné plus de ${data.currency}${data.amount}! 💎`;
          metadata.totalSaved = data.amount;
          metadata.currency = data.currency;
          break;
        default:
          message = `${user.username} a atteint un milestone`;
      }

      await AdminNotification.createNotification({
        type: 'user_milestone',
        title: '🏅 Milestone atteint',
        message,
        severity: 'success',
        userId: user._id,
        metadata
      });
      logger.info(`Admin notification created: Milestone ${milestoneType} for ${user.email}`);
    } catch (error) {
      logger.error('Error creating milestone notification:', error);
    }
  }

  /**
   * Log d'une action admin
   */
  static async logAdminAction(admin, action, target, details = {}) {
    try {
      let message = '';
      let severity = 'info';

      switch (action) {
        case 'user_updated':
          message = `${admin.username} a modifié l'utilisateur ${target.username}`;
          if (details.roleChanged) {
            message += ` (rôle: ${details.oldRole} → ${details.newRole})`;
            severity = 'warning';
          }
          break;
        case 'user_deleted':
          message = `${admin.username} a supprimé l'utilisateur ${target.email}`;
          severity = 'critical';
          break;
        case 'goal_updated':
          message = `${admin.username} a modifié l'objectif "${target.name}"`;
          break;
        case 'goal_deleted':
          message = `${admin.username} a supprimé l'objectif "${target.name}"`;
          severity = 'warning';
          break;
        case 'user_promoted':
          message = `${admin.username} a promu ${target.username} en admin`;
          severity = 'warning';
          break;
        case 'user_demoted':
          message = `${admin.username} a rétrogradé ${target.username} en user`;
          severity = 'warning';
          break;
        default:
          message = `${admin.username} a effectué: ${action}`;
      }

      await AdminNotification.createNotification({
        type: 'admin_action',
        title: '⚙️ Action admin',
        message,
        severity,
        adminId: admin._id,
        userId: target._id || null,
        metadata: {
          adminUsername: admin.username,
          action,
          ...details
        }
      });
      logger.info(`Admin action logged: ${action} by ${admin.email}`);
    } catch (error) {
      logger.error('Error logging admin action:', error);
    }
  }

  /**
   * Notification pour activité suspecte
   */
  static async notifySuspiciousActivity(type, data) {
    try {
      let message = '';

      switch (type) {
        case 'multiple_failed_logins':
          message = `Tentatives de connexion échouées multiples pour ${data.email}`;
          break;
        case 'rapid_goal_creation':
          message = `${data.username} a créé ${data.count} objectifs en ${data.timeframe} minutes`;
          break;
        case 'unusual_amount':
          message = `Montant inhabituel: ${data.currency}${data.amount} pour "${data.goalName}"`;
          break;
        default:
          message = `Activité suspecte détectée: ${type}`;
      }

      await AdminNotification.createNotification({
        type: 'suspicious_activity',
        title: '⚠️ Activité suspecte',
        message,
        severity: 'critical',
        userId: data.userId || null,
        metadata: data
      });
      logger.warn(`Suspicious activity notification created: ${type}`);
    } catch (error) {
      logger.error('Error creating suspicious activity notification:', error);
    }
  }

  /**
   * Récupérer les notifications avec filtres
   */
  static async getNotifications(filters = {}, options = {}) {
    try {
      logger.info(`[NOTIFICATION GET] Fetching notifications with filters: ${JSON.stringify(filters)}`);

      const {
        type,
        severity,
        isRead,
        startDate,
        endDate
      } = filters;

      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        order = 'desc'
      } = options;

      // Construction du filtre
      const query = {};

      if (type) query.type = type;
      if (severity) query.severity = severity;
      if (isRead !== undefined) query.isRead = isRead;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      logger.info(`[NOTIFICATION GET] Query: ${JSON.stringify(query)}`);

      // Tri
      const sortOptions = {};
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Récupérer les notifications
      const notifications = await AdminNotification.find(query)
        .populate('userId', 'username email')
        .populate('adminId', 'username email')
        .populate('goalId', 'name amounts.target amounts.currency')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await AdminNotification.countDocuments(query);

      logger.info(`[NOTIFICATION GET] Found ${notifications.length} notifications (total: ${total})`);

      return {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalNotifications: total,
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('[NOTIFICATION GET] Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  static async markAllAsRead() {
    try {
      const result = await AdminNotification.updateMany(
        { isRead: false },
        { isRead: true, readAt: new Date() }
      );
      logger.info(`Marked ${result.modifiedCount} notifications as read`);
      return result;
    } catch (error) {
      logger.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Supprimer les anciennes notifications
   */
  static async cleanOldNotifications(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await AdminNotification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });

      logger.info(`Deleted ${result.deletedCount} old notifications`);
      return result;
    } catch (error) {
      logger.error('Error cleaning old notifications:', error);
      throw error;
    }
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  static async getUnreadCount() {
    try {
      return await AdminNotification.countDocuments({ isRead: false });
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }
}

export default NotificationService;
