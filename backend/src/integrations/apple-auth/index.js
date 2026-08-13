const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { AppError } = require('../../utils/errors');

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

/** @type {{ keys: object[], fetchedAt: number } | null} */
let jwksCache = null;
const JWKS_TTL_MS = 60 * 60 * 1000;

async function fetchAppleJwks(force = false) {
  if (!force && jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const res = await fetch(APPLE_JWKS_URL, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new AppError('Could not fetch Apple signing keys', 503);
  }
  const data = await res.json();
  if (!Array.isArray(data.keys) || data.keys.length === 0) {
    throw new AppError('Apple signing keys unavailable', 503);
  }
  jwksCache = { keys: data.keys, fetchedAt: Date.now() };
  return data.keys;
}

function jwkToPem(jwk) {
  const keyObject = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  return keyObject.export({ type: 'spki', format: 'pem' });
}

function verifyWithPem(idToken, pem, clientId, emailHint, nameHint) {
  let payload;
  try {
    payload = jwt.verify(idToken, pem, {
      algorithms: ['RS256'],
      issuer: APPLE_ISSUER,
      audience: clientId,
    });
  } catch (err) {
    throw new AppError(`Invalid Apple identity token: ${err.message}`, 401);
  }

  if (!payload.sub) {
    throw new AppError('Apple identity token missing subject', 401);
  }

  const email =
    (typeof payload.email === 'string' && payload.email) ||
    (typeof emailHint === 'string' && emailHint.trim()) ||
    null;

  const name =
    (typeof nameHint === 'string' && nameHint.trim()) ||
    (email ? email.split('@')[0] : 'Apple User');

  return {
    providerId: payload.sub,
    email,
    name,
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
  };
}

/**
 * Verifies an Apple identity token (JWT) from Sign in with Apple (web/iOS).
 */
const verifyAppleIdToken = async (idToken, { email: emailHint, name: nameHint } = {}) => {
  const clientId = env.apple.clientId || '';
  if (!clientId) {
    throw new AppError('Apple Sign-In is not configured (APPLE_CLIENT_ID missing)', 503);
  }

  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded?.header?.kid || !decoded.payload) {
    throw new AppError('Invalid Apple identity token', 401);
  }

  let keys = await fetchAppleJwks(false);
  let jwk = keys.find((k) => k.kid === decoded.header.kid);
  if (!jwk) {
    keys = await fetchAppleJwks(true);
    jwk = keys.find((k) => k.kid === decoded.header.kid);
  }
  if (!jwk) {
    throw new AppError('Apple identity token signing key not found', 401);
  }

  return verifyWithPem(idToken, jwkToPem(jwk), clientId, emailHint, nameHint);
};

module.exports = { verifyAppleIdToken };
