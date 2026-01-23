import { asyncHandler } from '../middleware/error.middleware.js';
import { successResponse } from '../utils/response.util.js';
import * as authService from '../services/auth.service.js';
import NotificationService from '../services/notification.service.js';

/**
 * @desc    Inscription d'un nouvel utilisateur
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);

  // Notifier les admins du nouvel utilisateur
  await NotificationService.notifyNewUser(result.user);

  successResponse(
    res,
    {
      user: result.user,
      tokens: result.tokens
    },
    'User registered successfully',
    201
  );
});

/**
 * @desc    Connexion d'un utilisateur
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.loginUser(email, password);

  successResponse(
    res,
    {
      user: result.user,
      tokens: result.tokens
    },
    'Login successful'
  );
});

/**
 * @desc    Rafraîchir le token d'accès
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const result = await authService.refreshAccessToken(refreshToken);

  successResponse(
    res,
    result,
    'Token refreshed successfully'
  );
});

/**
 * @desc    Déconnexion d'un utilisateur
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  await authService.logoutUser(req.userId, refreshToken);

  successResponse(
    res,
    null,
    'Logged out successfully'
  );
});

/**
 * @desc    Déconnexion de tous les appareils
 * @route   POST /api/v1/auth/logout-all
 * @access  Private
 */
export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAllDevices(req.userId);

  successResponse(
    res,
    null,
    'Logged out from all devices successfully'
  );
});

/**
 * @desc    Connexion admin - Auto-promote user to admin role
 * @route   POST /api/v1/auth/admin-login
 * @access  Public
 */
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.loginUser(email, password);

  // Auto-promote to admin if not already
  if (result.user.role !== 'admin') {
    const User = (await import('../models/User.model.js')).default;
    // Use findOneAndUpdate to avoid version conflicts
    const updatedUser = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: 'admin' },
      { new: true }
    );

    if (updatedUser) {
      result.user.role = 'admin';
    }
  }

  successResponse(
    res,
    {
      user: result.user,
      tokens: result.tokens
    },
    'Admin login successful - You have been granted admin privileges'
  );
});
