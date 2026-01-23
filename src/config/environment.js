import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/finsmart',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:8081'],

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validation des variables critiques
if (!config.jwt.secret || !config.jwt.refreshSecret) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be defined');
}

if (config.jwt.secret.length < 32 || config.jwt.refreshSecret.length < 32) {
  console.warn('⚠️  Warning: JWT secrets should be at least 32 characters long for security');
}

export default config;
