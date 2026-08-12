# Do That Later

Optional / deferred tasks that are **not blockers** for starting Milestone 2.  
Complete these when you have the credentials or AWS account ready.

> Spec tracker: [`Blinkit.md`](./Blinkit.md) §21 · User Web address UI already works without Maps key (manual + GPS + OSM).

---

## Tasks

### 1. Put real Google + Maps API keys in `.env`

**Why:** End-to-end testing of Google Sign-In and **autocomplete** address search (Blinkit-like suggestions).

**File:** `backend/.env`

```env
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
MAPS_API_KEY=<your-google-maps-places-api-key>
```

**Endpoints affected:**
| Variable | Endpoint | Without key |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | `POST /api/v1/auth/oauth/google` | Integration error / not usable |
| `MAPS_API_KEY` | `GET /api/v1/addresses/search?q=` | HTTP `503` |

**User Web without `MAPS_API_KEY`:** Address modal still usable — type area manually, use GPS, OpenStreetMap embed for pin preview. Only Places autocomplete is unavailable.

**Notes:**
- Enable **Places API** (and Maps if needed) in Google Cloud for `MAPS_API_KEY`.
- Restart the backend after updating `.env`.

---

### 2. Create an S3 bucket and set credentials (for catalog image uploads)

**Why:** Milestone 2 product images upload to S3 from day one. The S3 client is already implemented (`backend/src/config/storage.js`); it stays in stub mode until these are set.

**File:** `backend/.env`

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
S3_BUCKET=<your-bucket-name>
CLOUDFRONT_DOMAIN=<optional-cdn-domain>
```

**Checklist:**
- [ ] Create S3 bucket (e.g. `blinkit-uploads`)
- [ ] Create IAM user/key with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on that bucket
- [ ] (Optional, later) CloudFront in front of S3 for product images only — **not** for hosting Next.js apps (those stay on Amplify)
- [ ] Set env vars and restart backend
- [ ] Confirm `GET /health` shows `"s3": true`

**Without credentials:** Uploads log as stubs and return localhost-style URLs — fine for API-only catalog work until images are needed.

---

## Status

| # | Task | Status |
|---|------|--------|
| 1 | `GOOGLE_CLIENT_ID` + `MAPS_API_KEY` | Pending |
| 2 | S3 bucket + AWS credentials | Pending |

When done, mark the row **Done** and optionally note the date.
