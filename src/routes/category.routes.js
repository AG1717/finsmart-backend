import express from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

/**
 * @route   GET /api/v1/categories
 * @desc    Obtenir toutes les catégories
 * @access  Private
 */
router.get(
  '/',
  categoryController.getCategories
);

/**
 * @route   POST /api/v1/categories/seed
 * @desc    Initialiser les catégories (development only)
 * @access  Private
 */
router.post(
  '/seed',
  categoryController.seedCategories
);

export default router;
