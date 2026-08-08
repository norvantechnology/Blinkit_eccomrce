const { OAuth2Client } = require('google-auth-library');
const env = require('../../config/env');
const { AppError } = require('../../utils/errors');

let client = null;

const getClient = () => {
  if (!env.google.clientId) {
    throw new AppError('Google OAuth is not configured (GOOGLE_CLIENT_ID missing)', 503);
  }
  if (!client) {
    client = new OAuth2Client(env.google.clientId);
  }
  return client;
};

/**
 * Verifies a Google ID token from the client and returns normalized profile fields.
 */
const verifyGoogleIdToken = async (idToken) => {
  const oauthClient = getClient();
  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: env.google.clientId,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new AppError('Invalid Google ID token', 401);
  }

  if (!payload.email_verified) {
    throw new AppError('Google account email is not verified', 401);
  }

  return {
    providerId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email?.split('@')[0] || 'Google User',
    picture: payload.picture,
  };
};

module.exports = { verifyGoogleIdToken, getClient };
