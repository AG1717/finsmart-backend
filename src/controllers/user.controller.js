import { asyncHandler } from '../middleware/error.middleware.js';
import { successResponse, errorResponse } from '../utils/response.util.js';
import User from '../models/User.model.js';
import { ERROR_MESSAGES } from '../utils/constants.js';

/**
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @route   GET /api/v1/users/me
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId).select('-password -refreshTokens');

  if (!user) {
    return errorResponse(res, ERROR_MESSAGES.USER_NOT_FOUND, 404);
  }

  successResponse(
    res,
    { user },
    'Profile retrieved successfully'
  );
});

/**
 * @desc    Mettre à jour le profil de l'utilisateur
 * @route   PUT /api/v1/users/me
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return errorResponse(res, ERROR_MESSAGES.USER_NOT_FOUND, 404);
  }

  // Mettre à jour le profil
  if (req.body.profile) {
    Object.keys(req.body.profile).forEach(key => {
      if (req.body.profile[key] !== undefined) {
        user.profile[key] = req.body.profile[key];
      }
    });
  }

  // Mettre à jour les préférences
  if (req.body.preferences) {
    Object.keys(req.body.preferences).forEach(key => {
      if (key === 'currency' && req.body.preferences.currency) {
        user.preferences.currency = req.body.preferences.currency;
      } else if (req.body.preferences[key] !== undefined) {
        user.preferences[key] = req.body.preferences[key];
      }
    });
  }

  await user.save();

  successResponse(
    res,
    { user: user.toJSON() },
    'Profile updated successfully'
  );
});

/**
 * @desc    Changer le mot de passe de l'utilisateur
 * @route   PUT /api/v1/users/me/password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Récupérer l'utilisateur avec le mot de passe
  const user = await User.findById(req.userId).select('+password');

  if (!user) {
    return errorResponse(res, ERROR_MESSAGES.USER_NOT_FOUND, 404);
  }

  // Vérifier le mot de passe actuel
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    return errorResponse(res, ERROR_MESSAGES.INVALID_PASSWORD, 401);
  }

  // Mettre à jour le mot de passe
  user.password = newPassword;
  await user.save();

  // Optionnel : invalider tous les refresh tokens pour forcer une reconnexion
  await user.clearRefreshTokens();

  successResponse(
    res,
    null,
    'Password changed successfully. Please login again.'
  );
});
