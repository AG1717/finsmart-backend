import NotificationService from '../services/notification.service.js';
import AdminNotification from '../models/AdminNotification.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';
import logger from '../config/logger.js';

/**
 * @desc    Obtenir toutes les notifications admin
 * @route   GET /api/v1/admin/notifications
 * @access  Private/Admin
 */
export const getNotifications = async (req, res) => {
  try {
    const {
      type,
      severity,
      isRead,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const filters = {
      type,
      severity,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      startDate,
      endDate
    };

    const options = {
      page,
      limit,
      sortBy,
      order
    };

    const result = await NotificationService.getNotifications(filters, options);

    return successResponse(res, result, 'Notifications retrieved successfully');
  } catch (error) {
    logger.error('Error getting notifications:', error);
    return errorResponse(res, 'Error retrieving notifications', 500);
  }
};

/**
 * @desc    Obtenir le nombre de notifications non lues
 * @route   GET /api/v1/admin/notifications/unread-count
 * @access  Private/Admin
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount();
    return successResponse(res, { count }, 'Unread count retrieved successfully');
  } catch (error) {
    logger.error('Error getting unread count:', error);
    return errorResponse(res, 'Error retrieving unread count', 500);
  }
};

/**
 * @desc    Marquer une notification comme lue
 * @route   PUT /api/v1/admin/notifications/:id/read
 * @access  Private/Admin
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await AdminNotification.findById(id);

    if (!notification) {
      return errorResponse(res, 'Notification not found', 404);
    }

    await notification.markAsRead();

    return successResponse(res, {
      notification
    }, 'Notification marked as read');
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    return errorResponse(res, 'Error marking notification as read', 500);
  }
};

/**
 * @desc    Marquer toutes les notifications comme lues
 * @route   PUT /api/v1/admin/notifications/mark-all-read
 * @access  Private/Admin
 */
export const markAllAsRead = async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead();

    return successResponse(res, {
      modifiedCount: result.modifiedCount
    }, 'All notifications marked as read');
  } catch (error) {
    logger.error('Error marking all as read:', error);
    return errorResponse(res, 'Error marking all as read', 500);
  }
};

/**
 * @desc    Supprimer une notification
 * @route   DELETE /api/v1/admin/notifications/:id
 * @access  Private/Admin
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await AdminNotification.findByIdAndDelete(id);

    if (!notification) {
      return errorResponse(res, 'Notification not found', 404);
    }

    logger.info(`Notification ${id} deleted by admin ${req.user.id}`);

    return successResponse(res, null, 'Notification deleted successfully');
  } catch (error) {
    logger.error('Error deleting notification:', error);
    return errorResponse(res, 'Error deleting notification', 500);
  }
};

/**
 * @desc    Nettoyer les anciennes notifications
 * @route   DELETE /api/v1/admin/notifications/cleanup
 * @access  Private/Admin
 */
export const cleanupNotifications = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const result = await NotificationService.cleanOldNotifications(parseInt(days));

    return successResponse(res, {
      deletedCount: result.deletedCount
    }, 'Old notifications cleaned successfully');
  } catch (error) {
    logger.error('Error cleaning notifications:', error);
    return errorResponse(res, 'Error cleaning notifications', 500);
  }
};

/**
 * @desc    Obtenir les statistiques des notifications
 * @route   GET /api/v1/admin/notifications/stats
 * @access  Private/Admin
 */
export const getNotificationStats = async (req, res) => {
  try {
    const totalCount = await AdminNotification.countDocuments();
    const unreadCount = await AdminNotification.countDocuments({ isRead: false });

    // Par type
    const byType = await AdminNotification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Par severity
    const bySeverity = await AdminNotification.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // Notifications récentes (24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const recentCount = await AdminNotification.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });

    return successResponse(res, {
      total: totalCount,
      unread: unreadCount,
      recent24h: recentCount,
      byType,
      bySeverity
    }, 'Notification stats retrieved successfully');
  } catch (error) {
    logger.error('Error getting notification stats:', error);
    return errorResponse(res, 'Error retrieving notification stats', 500);
  }
};
