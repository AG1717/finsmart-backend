import { asyncHandler } from '../middleware/error.middleware.js';
import { successResponse } from '../utils/response.util.js';
import Category from '../models/Category.model.js';

/**
 * @desc    Obtenir toutes les catégories
 * @route   GET /api/v1/categories
 * @access  Private
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ order: 1 });

  successResponse(
    res,
    { categories },
    'Categories retrieved successfully'
  );
});

/**
 * @desc    Initialiser les catégories (seed)
 * @route   POST /api/v1/categories/seed
 * @access  Private (Admin only - pour le développement)
 */
export const seedCategories = asyncHandler(async (req, res) => {
  const result = await Category.seedCategories();

  successResponse(
    res,
    result,
    result.message,
    201
  );
});
