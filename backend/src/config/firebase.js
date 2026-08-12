/**
 * Stub Firebase Admin SDK — enable later with FIREBASE_* env if needed.
 */
const firebase = {
  initialized: false,

  init() {
    console.log('[firebase] Stub mode — not configured');
  },

  async verifyIdToken(_idToken) {
    throw new Error('Firebase Phone Auth not configured');
  },

  async sendPushNotification({ token, title }) {
    console.log(`[firebase] Stub FCM push token=${token} title=${title}`);
    return { success: true };
  },
};

firebase.init();

module.exports = firebase;
