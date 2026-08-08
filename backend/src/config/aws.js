/**
 * Stub shared AWS SDK clients for local development.
 * In production: SES, SNS, Rekognition, Transcribe, Secrets Manager.
 */
const env = require('./env');

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
      return { MessageId: 'stub-sms-id' };
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
    async getSecret(_secretName) {
      console.log('[aws.secretsManager] Stub getSecret');
      return {};
    },
  },
};

module.exports = aws;
