# Deferred — post Milestone 1

M1 Phase 1 is **code-complete**. Add credentials when ready (see [`M1_PHASE1.md`](./M1_PHASE1.md)).

| Item | When you add env | Doc |
|---|---|---|
| Google Sign-In | `GOOGLE_CLIENT_ID` + `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | [`SOCIAL_LOGIN_SETUP.md`](./SOCIAL_LOGIN_SETUP.md) |
| Apple Sign-In | `APPLE_CLIENT_ID` + `NEXT_PUBLIC_APPLE_*` | [`SOCIAL_LOGIN_SETUP.md`](./SOCIAL_LOGIN_SETUP.md) |
| Google Maps search | `MAPS_API_KEY` (Places API) | [`M1_PHASE1.md`](./M1_PHASE1.md) |
| Real SMS OTP | `OTP_SMS_PROVIDER=sns` | — |
| Firebase Phone Auth | Not implemented (501) | — |
| S3 avatars prod | `S3_BUCKET` + IAM | — |
| Catalog / cart / checkout | Milestone 2–3 | — |
| Admin CRUD | Milestone 4 | — |

Until keys are set: OTP **123456**, location search uses **OSM**, Google/Apple buttons show a config message.
