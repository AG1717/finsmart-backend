import express from 'express';
import authRoutes from './auth.routes.js';
import goalRoutes from './goal.routes.js';
import userRoutes from './user.routes.js';
import categoryRoutes from './category.routes.js';
import analyticsRoutes from './analytics.routes.js';
import adminRoutes from './admin.routes.js';

const router = express.Router();

/**
 * Sanity check endpoint
 * @route GET /api/v1/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'FinSmart API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

/**
 * Mount routes
 */
router.use('/auth', authRoutes);
router.use('/goals', goalRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);

export default router;
