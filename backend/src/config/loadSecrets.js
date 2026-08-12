/**
 * Load app config from AWS Secrets Manager into process.env.
 * Secret name/region are non-sensitive and live in constants.js.
 * Credentials: default AWS chain (EC2 instance role, ~/.aws/credentials, or env).
 */
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const { SECRETS_MANAGER } = require('./constants');

let loaded = false;

async function loadSecrets() {
  if (loaded) return;
  if (process.env.SKIP_SECRETS_MANAGER === '1') {
    console.warn('[secrets] SKIP_SECRETS_MANAGER=1 — using existing process.env');
    loaded = true;
    return;
  }

  const secretId = SECRETS_MANAGER.SECRET_NAME;
  const region = process.env.AWS_REGION || SECRETS_MANAGER.REGION;

  const client = new SecretsManagerClient({ region });
  const res = await client.send(new GetSecretValueCommand({ SecretId: secretId }));

  let payload = res.SecretString;
  if (!payload && res.SecretBinary) {
    payload = Buffer.from(res.SecretBinary).toString('utf8');
  }
  if (!payload) {
    throw new Error(`Secret ${secretId} is empty`);
  }

  const data = JSON.parse(payload);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Secret must be a JSON object of env key/value pairs');
  }

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    // Do not clobber explicit AWS bootstrap credentials from the host/role
    if (
      (key === 'AWS_ACCESS_KEY_ID' || key === 'AWS_SECRET_ACCESS_KEY' || key === 'AWS_SESSION_TOKEN')
      && process.env[key]
    ) {
      continue;
    }
    process.env[key] = String(value);
  }

  if (!process.env.AWS_REGION) {
    process.env.AWS_REGION = region;
  }
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }
  if (!process.env.PORT) {
    process.env.PORT = '4000';
  }

  loaded = true;
  console.error(`[secrets] Loaded ${Object.keys(data).length} keys from ${secretId}`);
}

module.exports = { loadSecrets };
