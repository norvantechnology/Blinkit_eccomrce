# Tapi Grocery

Monorepo: `backend` (API) · `user-web` (storefront) · `admin-panel`

## Local

```bash
docker compose up -d postgres redis
cd backend && cp .env.example .env && npm i && npm run db:setup && npm run dev
cd admin-panel && cp .env.example .env.local && npm i && npm run dev   # :3000
cd user-web && cp .env.example .env.local && npm i && npm run dev      # :3001
```

| App | URL | Login |
|-----|-----|--------|
| API | http://localhost:4000 | — |
| Admin | http://localhost:3000 | `admin@gmail.com` / `admin@123` |
| Store | http://localhost:3001 | `rahul@example.com` / `Customer@123` |

## Deploy

Push to `main` → `.github/workflows/deploy.yml` (EC2 API → Amplify user-web → Amplify admin).

**GitHub secrets:** `EC2_SSH_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AMPLIFY_APP_ID_USER_WEB`, `AMPLIFY_APP_ID_ADMIN`, `GH_PAT`
