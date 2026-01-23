import app from './src/app.js';
import config from './src/config/environment.js';
import connectDB from './src/config/database.js';
import logger from './src/config/logger.js';
import Category from './src/models/Category.model.js';

/**
 * Fonction pour démarrer le serveur
 */
const startServer = async () => {
  try {
    // 1. Connexion à la base de données
    await connectDB();
    logger.info('✅ Database connected successfully');

    // 2. Initialiser les catégories si nécessaire
    try {
      await Category.seedCategories();
    } catch (error) {
      logger.warn('⚠️  Category seeding skipped or failed:', error.message);
    }

    // 3. Démarrer le serveur Express
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`);
      logger.info(`📍 API Base URL: http://localhost:${config.port}/api/v1`);
      logger.info(`🏥 Health Check: http://localhost:${config.port}/api/v1/health`);

      if (config.nodeEnv === 'development') {
        logger.info(`📚 API Documentation: http://localhost:${config.port}/`);
      }
    });

    // 4. Gestion de l'arrêt gracieux
    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('✅ HTTP server closed');

        try {
          // Fermer la connexion à la base de données
          const mongoose = (await import('mongoose')).default;
          await mongoose.connection.close();
          logger.info('✅ Database connection closed');

          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Forcer l'arrêt après 10 secondes si le serveur ne se ferme pas
      setTimeout(() => {
        logger.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Écouter les signaux d'arrêt
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Gestion des erreurs non gérées
    process.on('unhandledRejection', (err) => {
      logger.error('❌ UNHANDLED REJECTION! Shutting down...', err);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('uncaughtException', (err) => {
      logger.error('❌ UNCAUGHT EXCEPTION! Shutting down...', err);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Démarrer le serveur
startServer();
