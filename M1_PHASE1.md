# Milestone 1 — Phase 1 complete

All M1 features are implemented in code. Add credentials to `.env` / Secrets Manager when ready.

## Feature checklist

| Feature | Status | Notes |
|---|---|---|
| Mobile OTP login | **Done** | Static `123456` — `OTP_SMS_PROVIDER=static` |
| Email login | **Done** | Seed: `rahul@example.com` / `Customer@123` |
| Google login | **Done** | Needs `GOOGLE_CLIENT_ID` + `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| Apple login | **Done** | Needs `APPLE_CLIENT_ID` + `NEXT_PUBLIC_APPLE_*` |
| User registration / profile | **Done** | OTP → name; settings for email/password/avatar |
| Multiple addresses | **Done** | CRUD + default + modal |
| GPS location | **Done** | Header + address modal + reverse geocode |
| Google Maps search | **Done** | `GET /places/search` (public) when `MAPS_API_KEY` set; OSM fallback |
| Language (en/hi) | **Done** | Saved on profile; applied on auth/account/location UI |
| Delete account | **Done** | Soft delete + revoke all sessions |

---

## Environment variables (add later)

### Backend (`backend/.env` or Secrets Manager)

```env
OTP_SMS_PROVIDER=static
OTP_STATIC_CODE=123456

GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
APPLE_CLIENT_ID=com.tapigrocery.web
MAPS_API_KEY=your-google-maps-api-key
```

### User web (`user-web/.env.local` or Amplify)

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
NEXT_PUBLIC_APPLE_CLIENT_ID=com.tapigrocery.web
NEXT_PUBLIC_APPLE_REDIRECT_URI=https://YOUR-DOMAIN/login
```

---

## Google Maps API — manual setup

1. Same Google Cloud project as OAuth (or create one).
2. **APIs & Services → Library** → enable:
   - **Places API**
   - (Optional) **Geocoding API**
3. **Credentials → Create credentials → API key**.
4. Restrict key → **Places API** + HTTP referrers (Amplify domain + localhost).
5. Set `MAPS_API_KEY` in backend Secrets Manager.
6. Restart backend / redeploy EC2 container.

Search uses `GET /api/v1/places/search?q=mg+road+bangalore` (no login required).

Without the key, the app uses **OpenStreetMap Nominatim** automatically.

---

## Google / Apple login setup

See [`SOCIAL_LOGIN_SETUP.md`](./SOCIAL_LOGIN_SETUP.md).

---

## Test locally (no API keys)

```bash
cd backend && npm run db:setup
cd backend && npm run dev
cd user-web && npm run dev
```

- OTP: any 10-digit mobile → **123456**
- Email: `rahul@example.com` / `Customer@123`
- Location search: OSM fallback works without `MAPS_API_KEY`
- Language: Account privacy → Hindi → Save

After you add keys to Secrets Manager + Amplify, redeploy once — Google/Apple login and Google Places search will activate automatically.
