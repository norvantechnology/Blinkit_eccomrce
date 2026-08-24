# Social login setup (Google + Apple)

Code for both providers is implemented. You must create developer credentials and put them in env / Secrets Manager.

---

## Where to put values

### Backend (AWS Secrets Manager JSON, or local `SKIP_SECRETS_MANAGER=1` env)

| Key | Example |
|---|---|
| `GOOGLE_CLIENT_ID` | `123456789-xxxx.apps.googleusercontent.com` |
| `APPLE_CLIENT_ID` | `com.tapigrocery.web` (Services ID) |

### User web (Amplify env / `user-web/.env.local`)

| Key | Example |
|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | **Same** as `GOOGLE_CLIENT_ID` |
| `NEXT_PUBLIC_APPLE_CLIENT_ID` | **Same** as `APPLE_CLIENT_ID` |
| `NEXT_PUBLIC_APPLE_REDIRECT_URI` | `https://YOUR-AMPLIFY-DOMAIN/login` (and `http://localhost:3001/login` for local) |

---

## A) Google Sign-In - manual steps

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project (e.g. **Tapi Grocery**).
3. Go to **APIs & Services → OAuth consent screen**.
   - User type: **External** (or Internal if Workspace-only).
   - App name: `Tapi Grocery`.
   - Support email: your email.
   - Add scopes: `email`, `profile`, `openid`.
   - Add test users while app is in **Testing**.
4. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**.
5. Application type: **Web application**.
6. Name: `Tapi Grocery Web`.
7. **Authorized JavaScript origins** (add all you use):
   - `http://localhost:3001`
   - `https://main.d14bykpxg1lhlf.amplifyapp.com` (your Amplify URL)
8. **Authorized redirect URIs** (GIS often works with origins only; still add):
   - `http://localhost:3001`
   - `http://localhost:3001/login`
   - `https://main.d14bykpxg1lhlf.amplifyapp.com`
   - `https://main.d14bykpxg1lhlf.amplifyapp.com/login`
9. Click **Create**. Copy the **Client ID**.
10. Set:
    - Backend secret: `GOOGLE_CLIENT_ID=<Client ID>`
    - Amplify / `.env.local`: `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<same Client ID>`
11. Redeploy backend (so Secrets Manager reload) and rebuild user-web.
12. Test: open `/login` → **Google** → pick account → you should land logged in.

**Common Google errors**

- `origin_mismatch` → JS origin not listed exactly (include `http://localhost:3001`).
- `403` / not configured → `GOOGLE_CLIENT_ID` missing on backend.
- Consent screen Testing → only allowlisted test users can sign in.

---

## B) Apple Sign-In - manual steps

You need a paid **Apple Developer Program** membership ($99/year).

### 1. App ID (bundle / primary)

1. Open [Apple Developer → Identifiers](https://developer.apple.com/account/resources/identifiers/list).
2. **+** → **App IDs** → Continue.
3. Type: **App**.
4. Description: `Tapi Grocery`.
5. Bundle ID: e.g. `com.tapigrocery.app` (Explicit).
6. Capabilities: enable **Sign In with Apple** → Continue → Register.

### 2. Services ID (this is your web Client ID)

1. Identifiers → **+** → **Services IDs** → Continue.
2. Description: `Tapi Grocery Web`.
3. Identifier: e.g. `com.tapigrocery.web` ← this is `APPLE_CLIENT_ID`.
4. Register → then **Edit** that Services ID.
5. Enable **Sign In with Apple** → **Configure**:
   - Primary App ID: select `com.tapigrocery.app`.
   - Domains and Subdomains:
     - `localhost` (for local; Apple is strict - many teams only use a real domain for Apple)
     - `main.d14bykpxg1lhlf.amplifyapp.com`
   - Return URLs (must match exactly):
     - `https://main.d14bykpxg1lhlf.amplifyapp.com/login`
     - If Apple allows localhost: `http://localhost:3001/login`
6. Save → Continue → Save.

### 3. Env values

```bash
# Backend Secrets Manager
APPLE_CLIENT_ID=com.tapigrocery.web

# user-web Amplify / .env.local
NEXT_PUBLIC_APPLE_CLIENT_ID=com.tapigrocery.web
NEXT_PUBLIC_APPLE_REDIRECT_URI=https://main.d14bykpxg1lhlf.amplifyapp.com/login
```

For local testing (only if that Return URL is registered):

```bash
NEXT_PUBLIC_APPLE_REDIRECT_URI=http://localhost:3001/login
```

### 4. Redeploy & test

1. Update Secrets Manager + Amplify env.
2. Restart backend / wait for Amplify build.
3. Open `/login` on HTTPS domain → **Apple** → complete Apple sheet → logged in.

**Notes**

- Apple **name/email** are only sent the **first** time the user authorizes your app; later logins use `sub` in the identity token only.
- Prefer testing Apple on the **Amplify HTTPS URL**; localhost often fails Apple domain verification.
- No Apple private key is required for this flow (we verify the **identity token** with Apple’s public JWKS).

---

## Quick checklist

- [ ] Google OAuth Web client created  
- [ ] `GOOGLE_CLIENT_ID` = `NEXT_PUBLIC_GOOGLE_CLIENT_ID`  
- [ ] Amplify + localhost origins added  
- [ ] Apple App ID + Services ID created  
- [ ] Sign In with Apple domains + return URLs saved  
- [ ] `APPLE_CLIENT_ID` = `NEXT_PUBLIC_APPLE_CLIENT_ID`  
- [ ] `NEXT_PUBLIC_APPLE_REDIRECT_URI` matches Apple Return URL exactly  
- [ ] Backend + user-web redeployed  

After that, both **Google** and **Apple** buttons on the login screen work.
