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

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isOriginAllowed = (origin, allowedOrigins) => {
  if (!origin) return true;
  if (allowedOrigins.includes('*')) return true;

  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin === origin) return true;
    if (!allowedOrigin.includes('*')) return false;

    const pattern = `^${escapeRegex(allowedOrigin).replace(/\\\*/g, '.*')}$`;
    return new RegExp(pattern).test(origin);
  });
};

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin, config.allowedOrigins)) {
      return callback(null, true);
    }

    logger.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

app.use('/api/', (req, res, next) => {
  if (req.path.startsWith('/v1/admin')) {
    return next();
  }
  generalLimiter(req, res, next);
});

app.use('/api/v1', routes);

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

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
