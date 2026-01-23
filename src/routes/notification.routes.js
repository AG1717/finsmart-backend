import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanupNotifications,
  getNotificationStats
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Toutes les routes nécessitent authentification + rôle admin
router.use(protect);
router.use(requireAdmin);

/**
 * @route   GET /api/v1/admin/notifications/stats
 * @desc    Obtenir les statistiques des notifications
 * @access  Private/Admin
 */
router.get('/stats', getNotificationStats);

/**
 * @route   GET /api/v1/admin/notifications/unread-count
 * @desc    Obtenir le nombre de notifications non lues
 * @access  Private/Admin
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   GET /api/v1/admin/notifications
 * @desc    Obtenir toutes les notifications avec filtres
 * @access  Private/Admin
 */
router.get('/', getNotifications);

/**
 * @route   PUT /api/v1/admin/notifications/mark-all-read
 * @desc    Marquer toutes les notifications comme lues
 * @access  Private/Admin
 */
router.put('/mark-all-read', markAllAsRead);

/**
 * @route   PUT /api/v1/admin/notifications/:id/read
 * @desc    Marquer une notification comme lue
 * @access  Private/Admin
 */
router.put('/:id/read', markAsRead);

/**
 * @route   DELETE /api/v1/admin/notifications/cleanup
 * @desc    Nettoyer les anciennes notifications
 * @access  Private/Admin
 */
router.delete('/cleanup', cleanupNotifications);

/**
 * @route   DELETE /api/v1/admin/notifications/:id
 * @desc    Supprimer une notification
 * @access  Private/Admin
 */
router.delete('/:id', deleteNotification);

export default router;
