import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import config from './config/environment.js';
import logger from './config/logger.js';
import routes from './routes/index.js';
import { generalLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();

/**
 * Security Middleware
 */
// Helmet aide à sécuriser les headers HTTP
// Disable crossOriginResourcePolicy and crossOriginOpenerPolicy to allow CORS
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

// CORS configuration - Allow all origins for mobile app and development
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Body Parser Middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Logging Middleware
 */
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  // En production, utiliser un format plus concis
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

/**
 * Rate Limiting
 * Skip rate limiting for admin routes (admins need unrestricted access)
 */
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for admin routes
  if (req.path.startsWith('/v1/admin')) {
    return next();
  }
  generalLimiter(req, res, next);
});

/**
 * API Routes
 */
app.use('/api/v1', routes);

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FinSmart API',
    version: '1.0.0',
    documentation: '/api/v1/health',
    endpoints: {
      health: 'GET /api/v1/health',
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        refresh: 'POST /api/v1/auth/refresh',
        logout: 'POST /api/v1/auth/logout'
      },
      users: {
        profile: 'GET /api/v1/users/me',
        updateProfile: 'PUT /api/v1/users/me',
        changePassword: 'PUT /api/v1/users/me/password'
      },
      goals: {
        list: 'GET /api/v1/goals',
        create: 'POST /api/v1/goals',
        get: 'GET /api/v1/goals/:id',
        update: 'PUT /api/v1/goals/:id',
        delete: 'DELETE /api/v1/goals/:id',
        contribute: 'POST /api/v1/goals/:id/contribute',
        dashboard: 'GET /api/v1/goals/dashboard'
      },
      categories: {
        list: 'GET /api/v1/categories'
      }
    }
  });
});

/**
 * Error Handling Middleware
 * Doit être après toutes les routes
 */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
