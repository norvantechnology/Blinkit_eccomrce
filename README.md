# Tapi Grocery

Monorepo: `backend` · `user-web` · `admin-panel`

## Config
- **Backend:** AWS Secrets Manager `tapi-grocery/backend` (no `.env`)
- **Frontends:** Amplify Console env vars (`NEXT_PUBLIC_API_URL`, `BACKEND_URL`)

## Deploy
Push to `main` → `.github/workflows/deploy.yml` deploys EC2 API + both Amplify apps.

**GitHub secrets:** `EC2_SSH_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AMPLIFY_APP_ID_USER_WEB`, `AMPLIFY_APP_ID_ADMIN`, `GH_PAT`
