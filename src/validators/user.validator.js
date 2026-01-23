import Joi from 'joi';
import { SUPPORTED_LANGUAGES, SUPPORTED_CURRENCIES } from '../utils/constants.js';

/**
 * Schéma de validation pour mettre à jour le profil utilisateur
 */
export const updateProfileSchema = Joi.object({
  profile: Joi.object({
    firstName: Joi.string()
      .trim()
      .max(50)
      .optional()
      .allow('')
      .messages({
        'string.max': 'First name cannot exceed 50 characters'
      }),

    lastName: Joi.string()
      .trim()
      .max(50)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Last name cannot exceed 50 characters'
      }),

    avatar: Joi.string()
      .uri()
      .optional()
      .allow(null, '')
      .messages({
        'string.uri': 'Avatar must be a valid URL'
      })
  }).optional(),

  preferences: Joi.object({
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
    }).optional(),

    notifications: Joi.boolean()
      .optional()
  }).optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Schéma de validation pour changer le mot de passe
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),

  newPassword: Joi.string()
    .min(8)
    .max(100)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .invalid(Joi.ref('currentPassword'))
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password cannot exceed 100 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'New password is required',
      'any.invalid': 'New password must be different from current password'
    })
});
