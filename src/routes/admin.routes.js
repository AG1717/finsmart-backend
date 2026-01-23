import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllGoals,
  deleteGoal,
  updateGoal,
  getPlatformStats
} from '../controllers/admin.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import notificationRoutes from './notification.routes.js';

const router = express.Router();

// Toutes les routes admin nécessitent authentification + rôle admin
router.use(protect);
router.use(requireAdmin);

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Obtenir les statistiques globales de la plateforme
 * @access  Private/Admin
 */
router.get('/stats', getPlatformStats);

/**
 * Users Management
 */

/**
 * @route   GET /api/v1/admin/users
 * @desc    Obtenir tous les utilisateurs (avec pagination et filtres)
 * @access  Private/Admin
 */
router.get('/users', getAllUsers);

/**
 * @route   GET /api/v1/admin/users/:userId
 * @desc    Obtenir un utilisateur spécifique avec tous ses détails
 * @access  Private/Admin
 */
router.get('/users/:userId', getUserById);

/**
 * @route   PUT /api/v1/admin/users/:userId
 * @desc    Mettre à jour un utilisateur (changer role, modifier profil, etc.)
 * @access  Private/Admin
 */
router.put('/users/:userId', updateUser);

/**
 * @route   DELETE /api/v1/admin/users/:userId
 * @desc    Supprimer un utilisateur et tous ses objectifs
 * @access  Private/Admin
 */
router.delete('/users/:userId', deleteUser);

/**
 * Goals Management
 */

/**
 * @route   GET /api/v1/admin/goals
 * @desc    Obtenir tous les objectifs (avec filtres et pagination)
 * @access  Private/Admin
 */
router.get('/goals', getAllGoals);

/**
 * @route   PUT /api/v1/admin/goals/:goalId
 * @desc    Mettre à jour un objectif (n'importe quel utilisateur)
 * @access  Private/Admin
 */
router.put('/goals/:goalId', updateGoal);

/**
 * @route   DELETE /api/v1/admin/goals/:goalId
 * @desc    Supprimer un objectif (n'importe quel utilisateur)
 * @access  Private/Admin
 */
router.delete('/goals/:goalId', deleteGoal);

/**
 * Notifications routes
 * Monté sur /api/v1/admin/notifications
 */
router.use('/notifications', notificationRoutes);

export default router;
