// Catégories d'objectifs
export const GOAL_CATEGORIES = {
  SURVIVAL: 'survival',
  NECESSITY: 'necessity',
  LIFESTYLE: 'lifestyle'
};

// Timeframes d'objectifs
export const GOAL_TIMEFRAMES = {
  SHORT: 'short',
  LONG: 'long'
};

// Statuts d'objectifs
export const GOAL_STATUSES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled'
};

// Langues supportées
export const SUPPORTED_LANGUAGES = ['fr', 'en'];

// Devises supportées
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' }
];

// Codes d'erreur
export const ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Server
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
};

// Messages d'erreur
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Your session has expired. Please login again',
  TOKEN_INVALID: 'Invalid authentication token',
  UNAUTHORIZED: 'You are not authorized to perform this action',

  // User
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'A user with this email or username already exists',
  INVALID_PASSWORD: 'Current password is incorrect',

  // Goal
  GOAL_NOT_FOUND: 'Goal not found',
  GOAL_NOT_AUTHORIZED: 'You are not authorized to access this goal',

  // Validation
  VALIDATION_ERROR: 'Please check your input and try again',

  // Server
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred. Please try again later',
  DATABASE_ERROR: 'Database operation failed'
};

// Pagination
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
};

// Rate limiting
export const RATE_LIMITS = {
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requêtes par fenêtre
  },
  AUTH: {
    windowMs: 5 * 60 * 1000, // 5 minutes (réduit pour dev)
    max: 20 // tentatives de connexion par fenêtre (augmenté pour dev)
  }
};
