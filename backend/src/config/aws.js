/**
 * Shared AWS helpers. Secrets Manager is real when credentials + region are set.
 */
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const env = require('./env');

let secretsClient = null;

const getSecretsClient = () => {
  if (!secretsClient) {
    secretsClient = new SecretsManagerClient({
      region: env.aws.region,
      ...(env.aws.accessKeyId && env.aws.secretAccessKey
        ? {
            credentials: {
              accessKeyId: env.aws.accessKeyId,
              secretAccessKey: env.aws.secretAccessKey,
            },
          }
        : {}),
    });
  }
  return secretsClient;
};

const aws = {
  region: env.aws.region,

  ses: {
    async sendEmail({ to, subject, body }) {
      console.log(`[aws.ses] Stub sendEmail to=${to} subject=${subject}`);
      return { MessageId: 'stub-message-id' };
    },
  },

  sns: {
    async publishSMS({ phone, message }) {
      console.log(`[aws.sns] Stub SMS to=${phone} message=${message}`);
    },
  },

  rekognition: {
    async detectLabels(_imageBuffer) {
      console.log('[aws.rekognition] Stub detectLabels');
      return { Labels: [] };
    },
  },

  transcribe: {
    async transcribeAudio(_audioBuffer) {
      console.log('[aws.transcribe] Stub transcribeAudio');
      return { text: '' };
    },
  },

  secretsManager: {
    async getSecret(secretName) {
      const name = secretName || env.aws.secretsManagerSecretName;
      if (!name) {
        console.log('[aws.secretsManager] No secret name configured');
        return {};
      }

      const res = await getSecretsClient().send(
        new GetSecretValueCommand({ SecretId: name }),
      );
      const raw = res.SecretString
        || (res.SecretBinary ? Buffer.from(res.SecretBinary).toString('utf8') : '{}');
      return JSON.parse(raw);
    },
  },
};

module.exports = aws;
