/**
 * Stub Firebase Admin SDK for local development.
 * In production: FCM push notifications + optional Phone Auth verification.
 */
const env = require('./env');

const firebase = {
  initialized: false,

  init() {
    if (!env.firebase.projectId) {
      console.log('[firebase] Stub mode — Firebase credentials not configured');
      return;
    }
    console.log('[firebase] Would initialize with project:', env.firebase.projectId);
    this.initialized = true;
  },

  async verifyIdToken(_idToken) {
    console.log('[firebase] Stub verifyIdToken');
    throw new Error('Firebase Phone Auth not configured in local dev');
  },

  async sendPushNotification({ token, title, body, data }) {
    console.log(`[firebase] Stub FCM push token=${token} title=${title}`);
    return { success: true };
  },
};

firebase.init();

module.exports = firebase;
