/** Google Identity Services (GIS) - returns a Google ID token for backend verify. */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            isDismissedMoment: () => boolean;
            getNotDisplayedReason?: () => string;
            getSkippedReason?: () => string;
          }) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: { type?: string; theme?: string; size?: string; width?: number },
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise: Promise<void> | null = null;

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google sign-in is only available in the browser'));
  }
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In')));
      if (window.google?.accounts?.id) resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Google Sign-In'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Opens Google One Tap / FedCM prompt and resolves with the ID token.
 * Falls back to a temporary GIS button popup if One Tap is blocked.
 */
export async function requestGoogleIdToken(clientId: string): Promise<string> {
  await loadGoogleIdentityScript();
  if (!window.google?.accounts?.id) {
    throw new Error('Google Sign-In unavailable');
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (credential: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(credential);
    };
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    let host: HTMLDivElement | null = null;
    const cleanup = () => {
      try {
        window.google?.accounts.id.cancel();
      } catch {
        /* ignore */
      }
      host?.remove();
      host = null;
    };

    window.google!.accounts.id.initialize({
      client_id: clientId,
      auto_select: false,
      cancel_on_tap_outside: true,
      callback: (response) => {
        if (response.credential) finish(response.credential);
        else fail(new Error('Google sign-in was cancelled'));
      },
    });

    window.google!.accounts.id.prompt((notification) => {
      if (settled) return;
      if (
        notification.isNotDisplayed() ||
        notification.isSkippedMoment() ||
        notification.isDismissedMoment()
      ) {
        // One Tap blocked - show GIS button so the user can complete sign-in
        host = document.createElement('div');
        host.setAttribute('role', 'dialog');
        host.setAttribute('aria-label', 'Continue with Google');
        Object.assign(host.style, {
          position: 'fixed',
          inset: '0',
          zIndex: '9999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.45)',
        });
        const card = document.createElement('div');
        Object.assign(card.style, {
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          minWidth: '280px',
          textAlign: 'center',
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        });
        const title = document.createElement('p');
        title.textContent = 'Continue with Google';
        Object.assign(title.style, {
          margin: '0 0 16px',
          fontWeight: '700',
          fontSize: '16px',
          color: '#1f1f1f',
        });
        const btnWrap = document.createElement('div');
        btnWrap.style.display = 'flex';
        btnWrap.style.justifyContent = 'center';
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Cancel';
        Object.assign(cancelBtn.style, {
          marginTop: '16px',
          border: 'none',
          background: 'transparent',
          color: '#666',
          cursor: 'pointer',
          fontSize: '13px',
        });
        cancelBtn.onclick = () => fail(new Error('Google sign-in was cancelled'));
        card.appendChild(title);
        card.appendChild(btnWrap);
        card.appendChild(cancelBtn);
        host.appendChild(card);
        host.addEventListener('click', (e) => {
          if (e.target === host) fail(new Error('Google sign-in was cancelled'));
        });
        document.body.appendChild(host);
        window.google!.accounts.id.renderButton(btnWrap, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 280,
        });
      }
    });
  });
}
