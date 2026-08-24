/** Sign in with Apple JS - returns identity token (+ optional name/email on first grant). */

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          state?: string;
          nonce?: string;
          usePopup?: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: {
            id_token: string;
            code?: string;
            state?: string;
          };
          user?: {
            email?: string;
            name?: {
              firstName?: string;
              lastName?: string;
            };
          };
        }>;
      };
    };
  }
}

const APPLE_SDK_SRC =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

let scriptPromise: Promise<void> | null = null;

export function loadAppleAuthScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Apple Sign-In is only available in the browser'));
  }
  if (window.AppleID?.auth) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${APPLE_SDK_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Apple Sign-In')));
      if (window.AppleID?.auth) resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = APPLE_SDK_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Apple Sign-In'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export type AppleSignInResult = {
  idToken: string;
  email?: string;
  name?: string;
};

/**
 * Opens Apple Sign-In popup and returns the identity token.
 * Name/email are only returned the first time the user authorizes your app.
 */
export async function requestAppleIdToken(options: {
  clientId: string;
  redirectURI: string;
}): Promise<AppleSignInResult> {
  await loadAppleAuthScript();
  if (!window.AppleID?.auth) {
    throw new Error('Apple Sign-In unavailable');
  }

  window.AppleID.auth.init({
    clientId: options.clientId,
    scope: 'name email',
    redirectURI: options.redirectURI,
    usePopup: true,
  });

  try {
    const response = await window.AppleID.auth.signIn();
    const idToken = response.authorization?.id_token;
    if (!idToken) {
      throw new Error('Apple Sign-In did not return an identity token');
    }

    const first = response.user?.name?.firstName || '';
    const last = response.user?.name?.lastName || '';
    const name = [first, last].filter(Boolean).join(' ').trim() || undefined;
    const email = response.user?.email || undefined;

    return { idToken, email, name };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/popup|cancel|closed|user_cancelled|user canceled/i.test(msg)) {
      throw new Error('Apple sign-in was cancelled');
    }
    throw err instanceof Error ? err : new Error(msg || 'Apple sign-in failed');
  }
}
