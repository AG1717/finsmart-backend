import Joi from 'joi';
import { SUPPORTED_LANGUAGES, SUPPORTED_CURRENCIES } from '../utils/constants.js';

/**
 * Schéma de validation pour l'inscription
 */
export const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username can only contain letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required'
    }),

  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(8)
    .max(100)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 100 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),

  firstName: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'First name cannot exceed 50 characters'
    }),

  lastName: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Last name cannot exceed 50 characters'
    }),

  language: Joi.string()
    .valid(...SUPPORTED_LANGUAGES)
    .optional()
    .messages({
      'any.only': `Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`
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
});

/**
 * Schéma de validation pour la connexion
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

/**
 * Schéma de validation pour le refresh token
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});
