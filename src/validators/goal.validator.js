import Joi from 'joi';
import { GOAL_CATEGORIES, GOAL_TIMEFRAMES, GOAL_STATUSES, SUPPORTED_CURRENCIES } from '../utils/constants.js';

/**
 * Schéma de validation pour créer un objectif
 */
export const createGoalSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Goal name must be at least 1 character',
      'string.max': 'Goal name cannot exceed 100 characters',
      'any.required': 'Goal name is required'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),

  category: Joi.string()
    .valid(...Object.values(GOAL_CATEGORIES))
    .required()
    .messages({
      'any.only': `Category must be one of: ${Object.values(GOAL_CATEGORIES).join(', ')}`,
      'any.required': 'Category is required'
    }),

  timeframe: Joi.string()
    .valid(...Object.values(GOAL_TIMEFRAMES))
    .required()
    .messages({
      'any.only': `Timeframe must be one of: ${Object.values(GOAL_TIMEFRAMES).join(', ')}`,
      'any.required': 'Timeframe is required'
    }),

  amounts: Joi.object({
    current: Joi.number()
      .min(0)
      .default(0)
      .messages({
        'number.min': 'Current amount cannot be negative'
      }),

    target: Joi.number()
      .positive()
      .required()
      .messages({
        'number.positive': 'Target amount must be greater than 0',
        'any.required': 'Target amount is required'
      }),

    currency: Joi.object({
      code: Joi.string()
        .uppercase()
        .valid(...SUPPORTED_CURRENCIES.map(c => c.code))
        .optional()
        .messages({
          'any.only': `Currency code must be one of: ${SUPPORTED_CURRENCIES.map(c => c.code).join(', ')}`
        }),
      symbol: Joi.string()
        .optional()
    }).optional()
  }).required(),

  dates: Joi.object({
    target: Joi.date()
      .iso()
      .min('now')
      .optional()
      .messages({
        'date.min': 'Target date must be in the future'
      })
  }).optional(),

  icon: Joi.string()
    .optional()
    .default('star')
});

/**
 * Schéma de validation pour mettre à jour un objectif
 */
export const updateGoalSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Goal name must be at least 1 character',
      'string.max': 'Goal name cannot exceed 100 characters'
    }),

  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),

  category: Joi.string()
    .valid(...Object.values(GOAL_CATEGORIES))
    .optional()
    .messages({
      'any.only': `Category must be one of: ${Object.values(GOAL_CATEGORIES).join(', ')}`
    }),

  timeframe: Joi.string()
    .valid(...Object.values(GOAL_TIMEFRAMES))
    .optional()
    .messages({
      'any.only': `Timeframe must be one of: ${Object.values(GOAL_TIMEFRAMES).join(', ')}`
    }),

  amounts: Joi.object({
    current: Joi.number()
      .min(0)
      .optional()
      .messages({
        'number.min': 'Current amount cannot be negative'
      }),

    target: Joi.number()
      .positive()
      .optional()
      .messages({
        'number.positive': 'Target amount must be greater than 0'
      }),

    currency: Joi.object({
      code: Joi.string()
        .uppercase()
        .optional(),
      symbol: Joi.string()
        .optional()
    }).optional()
  }).optional(),

  dates: Joi.object({
    target: Joi.date()
      .iso()
      .min('now')
      .optional()
      .allow(null)
      .messages({
        'date.min': 'Target date must be in the future'
      })
  }).optional(),

  status: Joi.string()
    .valid(...Object.values(GOAL_STATUSES))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(GOAL_STATUSES).join(', ')}`
    }),

  icon: Joi.string()
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Schéma de validation pour ajouter une contribution
 */
export const contributeSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Contribution amount must be greater than 0',
      'any.required': 'Amount is required'
    }),

  note: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Note cannot exceed 200 characters'
    })
});

/**
 * Schéma de validation pour les filtres de recherche d'objectifs
 */
export const getGoalsQuerySchema = Joi.object({
  timeframe: Joi.string()
    .valid(...Object.values(GOAL_TIMEFRAMES))
    .optional()
    .messages({
      'any.only': `Timeframe must be one of: ${Object.values(GOAL_TIMEFRAMES).join(', ')}`
    }),

  category: Joi.string()
    .valid(...Object.values(GOAL_CATEGORIES))
    .optional()
    .messages({
      'any.only': `Category must be one of: ${Object.values(GOAL_CATEGORIES).join(', ')}`
    }),

  status: Joi.string()
    .valid(...Object.values(GOAL_STATUSES))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(GOAL_STATUSES).join(', ')}`
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
});

/**
 * Schéma de validation pour l'ID de l'objectif dans les params
 */
export const goalIdSchema = Joi.object({
  id: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.hex': 'Invalid goal ID format',
      'string.length': 'Invalid goal ID length',
      'any.required': 'Goal ID is required'
    })
});
