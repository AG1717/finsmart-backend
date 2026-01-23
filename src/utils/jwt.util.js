import jwt from 'jsonwebtoken';
import config from '../config/environment.js';

/**
 * Générer un access token
 * @param {Object} payload - Données à inclure dans le token
 * @returns {String} Token JWT
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

/**
 * Générer un refresh token
 * @param {Object} payload - Données à inclure dans le token
 * @returns {String} Token JWT
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  });
};

/**
 * Vérifier un access token
 * @param {String} token - Token à vérifier
 * @returns {Object} Payload décodé
 * @throws {Error} Si le token est invalide
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

/**
 * Vérifier un refresh token
 * @param {String} token - Token à vérifier
 * @returns {Object} Payload décodé
 * @throws {Error} Si le token est invalide
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Générer une paire de tokens (access + refresh)
 * @param {Object} user - Objet utilisateur
 * @returns {Object} { accessToken, refreshToken, expiresIn }
 */
export const generateTokenPair = (user) => {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    username: user.username
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Calculer l'expiration en secondes
  const expiresIn = getTokenExpirationInSeconds(config.jwt.expiresIn);

  return {
    accessToken,
    refreshToken,
    expiresIn
  };
};

/**
 * Convertir une durée (ex: '1h', '7d') en secondes
 * @param {String} duration - Durée au format '1h', '7d', etc.
 * @returns {Number} Durée en secondes
 */
const getTokenExpirationInSeconds = (duration) => {
  const units = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24
  };

  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 3600; // Par défaut 1 heure

  const value = parseInt(match[1], 10);
  const unit = match[2];

  return value * units[unit];
};

/**
 * Décoder un token sans vérification (pour debugging)
 * @param {String} token - Token à décoder
 * @returns {Object} Payload décodé
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
