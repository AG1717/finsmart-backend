import app from '../src/app.js';
import connectDB from '../src/config/database.js';
import logger from '../src/config/logger.js';
import Category from '../src/models/Category.model.js';

// Connexion à MongoDB (sera réutilisée entre les invocations)
let isConnected = false;

async function ensureConnection() {
  if (isConnected) {
    return;
  }

  try {
    await connectDB();
    logger.info('✅ Database connected');

    // Initialiser les catégories
    try {
      await Category.seedCategories();
    } catch (error) {
      logger.warn('⚠️  Category seeding skipped');
    }

    isConnected = true;
  } catch (error) {
    logger.error('❌ Database connection error:', error);
    throw error;
  }
}

// Handler Vercel
export default async function handler(req, res) {
  try {
    await ensureConnection();
    return app(req, res);
  } catch (error) {
    logger.error('Handler error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
}
