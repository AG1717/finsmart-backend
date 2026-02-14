import User from '../models/User.model.js';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt.util.js';
import { ERROR_MESSAGES } from '../utils/constants.js';
import { SUPPORTED_CURRENCIES } from '../utils/constants.js';

/**
 * Service d'inscription d'un nouvel utilisateur
 * @param {Object} userData - Données de l'utilisateur
 * @returns {Object} Utilisateur créé et tokens
 */
export const registerUser = async (userData) => {
  const { username, email, password, firstName, lastName, language, currency } = userData;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'username';
    throw {
      statusCode: 409,
      message: `A user with this ${field} already exists`
    };
  }

  // Préparer les données de l'utilisateur
  const newUserData = {
    username,
    email,
    password,
    profile: {
      firstName: firstName || '',
      lastName: lastName || ''
    },
    preferences: {
      language: language || 'fr'
    }
  };

  // Ajouter la devise si fournie
  if (currency) {
    const foundCurrency = SUPPORTED_CURRENCIES.find(c => c.code === currency.code);
    newUserData.preferences.currency = {
      code: currency.code,
      symbol: currency.symbol || (foundCurrency ? foundCurrency.symbol : '$')
    };
  }

  // Créer l'utilisateur
  const user = await User.create(newUserData);

  // Générer les tokens
  const tokens = generateTokenPair(user);

  // Sauvegarder le refresh token
  await user.addRefreshToken(tokens.refreshToken);

  // Retourner l'utilisateur (sans password) et les tokens
  const userObject = user.toJSON();

  return {
    user: userObject,
    tokens
  };
};

/**
 * Service de connexion d'un utilisateur
 * @param {String} email - Email de l'utilisateur
 * @param {String} password - Mot de passe
 * @returns {Object} Utilisateur et tokens
 */
export const loginUser = async (email, password) => {
  // Trouver l'utilisateur et inclure le password pour la comparaison
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw {
      statusCode: 401,
      message: ERROR_MESSAGES.INVALID_CREDENTIALS
    };
  }

  // Vérifier le mot de passe
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw {
      statusCode: 401,
      message: ERROR_MESSAGES.INVALID_CREDENTIALS
    };
  }

  // Générer les tokens
  const tokens = generateTokenPair(user);

  // Sauvegarder le refresh token
  await user.addRefreshToken(tokens.refreshToken);

  // Retourner l'utilisateur (sans password) et les tokens
  const userObject = user.toJSON();

  return {
    user: userObject,
    tokens
  };
};

/**
 * Service de rafraîchissement du token
 * @param {String} refreshToken - Refresh token
 * @returns {Object} Nouveau access token
 */
export const refreshAccessToken = async (refreshToken) => {
  // Vérifier le refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw {
      statusCode: 401,
      message: error.message || ERROR_MESSAGES.TOKEN_INVALID
    };
  }

  // Trouver l'utilisateur
  const user = await User.findById(decoded.id);

  if (!user) {
    throw {
      statusCode: 401,
      message: ERROR_MESSAGES.USER_NOT_FOUND
    };
  }

  // Vérifier que le refresh token est dans la liste de l'utilisateur
  if (!user.hasRefreshToken(refreshToken)) {
    throw {
      statusCode: 401,
      message: 'Invalid refresh token'
    };
  }

  // Générer un nouveau access token
  const tokens = generateTokenPair(user);

  // Remplacer l'ancien refresh token par le nouveau
  await user.removeRefreshToken(refreshToken);
  await user.addRefreshToken(tokens.refreshToken);

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn
  };
};

/**
 * Service de déconnexion d'un utilisateur
 * @param {String} userId - ID de l'utilisateur
 * @param {String} refreshToken - Refresh token à supprimer
 */
export const logoutUser = async (userId, refreshToken) => {
  const user = await User.findById(userId);

  if (!user) {
    throw {
      statusCode: 404,
      message: ERROR_MESSAGES.USER_NOT_FOUND
    };
  }

  // Supprimer le refresh token
  if (refreshToken) {
    await user.removeRefreshToken(refreshToken);
  }

  return { message: 'Logged out successfully' };
};

/**
 * Service de déconnexion de tous les appareils
 * @param {String} userId - ID de l'utilisateur
 */
export const logoutAllDevices = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw {
      statusCode: 404,
      message: ERROR_MESSAGES.USER_NOT_FOUND
    };
  }

  // Supprimer tous les refresh tokens
  await user.clearRefreshTokens();

  return { message: 'Logged out from all devices successfully' };
};

/**
 * Demander un code de réinitialisation de mot de passe
 * @param {String} email - Email de l'utilisateur
 * @returns {Object} Message de confirmation
 */
export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw {
      statusCode: 404,
      message: 'No account found with this email address'
    };
  }

  // Générer un code à 6 chiffres
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expire dans 15 minutes

  user.resetCode = { code, expiresAt };
  await user.save();

  // En production, envoyer par email. En dev, log le code
  console.log(`[PASSWORD RESET] Code for ${email}: ${code}`);

  return {
    message: 'Reset code sent. Check your email or contact admin.',
    // En dev seulement, retourner le code pour faciliter les tests
    ...(process.env.NODE_ENV === 'development' && { resetCode: code })
  };
};

/**
 * Réinitialiser le mot de passe avec le code
 * @param {String} email - Email de l'utilisateur
 * @param {String} code - Code de réinitialisation
 * @param {String} newPassword - Nouveau mot de passe
 */
export const resetPassword = async (email, code, newPassword) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw {
      statusCode: 404,
      message: 'No account found with this email address'
    };
  }

  if (!user.resetCode || !user.resetCode.code) {
    throw {
      statusCode: 400,
      message: 'No reset code requested. Please request a new one.'
    };
  }

  if (new Date() > user.resetCode.expiresAt) {
    user.resetCode = { code: null, expiresAt: null };
    await user.save();
    throw {
      statusCode: 400,
      message: 'Reset code has expired. Please request a new one.'
    };
  }

  if (user.resetCode.code !== code) {
    throw {
      statusCode: 400,
      message: 'Invalid reset code'
    };
  }

  // Mettre à jour le mot de passe
  user.password = newPassword;
  user.resetCode = { code: null, expiresAt: null };
  await user.clearRefreshTokens(); // Déconnecter de tous les appareils
  await user.save();

  return { message: 'Password reset successfully. You can now login with your new password.' };
};
