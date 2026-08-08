# Blinkit Backend API

Node.js + Express + Prisma REST API for the Blinkit-clone single-store platform.

## Prerequisites

- Node.js 18+
- PostgreSQL 15+ with PostGIS extension

## Setup

```bash
cp .env.example .env
# Edit DATABASE_URL and JWT secrets

npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

API runs at `http://localhost:4000`. Health check: `GET /health`.

## Docker

**Dockerfile path:** `backend/Dockerfile`

### Build image only

```bash
cd backend
docker build -t blinkit-backend:latest .
```

### Run full stack (Postgres + Redis + API)

From the repo root:

```bash
# First time: create tables + seed admin user
RUN_DB_SETUP=1 docker compose up -d --build

# Later runs
docker compose up -d
```

API: `http://localhost:4000`  
Health: `http://localhost:4000/health`  
**API Docs:** `http://localhost:4000/api-docs` (server URL auto-detected)

Set `API_BASE_URL` in `.env` to force a fixed docs server URL (e.g. Docker/production).

### Build & run backend container only

```bash
docker build -t blinkit-backend:latest ./backend
docker run -p 4000:4000 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5433/blinkit \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e JWT_ACCESS_SECRET=change-me \
  -e JWT_REFRESH_SECRET=change-me \
  blinkit-backend:latest
```

Base API path: `/api/v1`.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with hot-reload |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed default store, roles, super admin |
| `npm run db:studio` | Open Prisma Studio |
| `npm test` | Run integration tests |

## Testing

Requires local **Redis** and a **PostgreSQL + PostGIS** database.

```bash
# Example: PostGIS via Docker
docker run -d --name blinkit-postgres \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=blinkit \
  -p 5433:5432 postgis/postgis:16-3.4

export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/blinkit?schema=public
npm run db:push && npm run db:seed
npm test
```

Tests use `TEST_DATABASE_URL` (see `.env.example`). Fixed OTP in test mode: `OTP_TEST_CODE=123456`.

## Local Dev Notes

- Redis is required (local via `REDIS_URL`); AWS S3 is optional — set `S3_BUCKET` + AWS credentials to enable real uploads.
- OTP is logged to console in non-production (see `integrations/sms-provider`).
- Set `DEFAULT_STORE_ID` in `.env` to the UUID printed by the seed script.
- Refresh tokens are stored **hashed in `user_devices` / `admin_users`** (source of truth) and mirrored in Redis for fast lookup.
- Admin access tokens: **8 h** (`JWT_ADMIN_ACCESS_EXPIRY`); user access: **15 min**.
- Admin mutating requests are written to `audit_logs` and **auto-purged after 5 days** (`AUDIT_RETENTION_DAYS`).
- Full DB setup: `npm run db:setup` (push + PostGIS GIST indexes + seed).
- Swagger UI: http://localhost:4000/api-docs
- Implementation tracker: [`../Blinkit.md` §21](../Blinkit.md#21-implementation-status-current) (**v2.5**)
- Seed store name: **Tapi Grocery** (slug `blinkit-store`)
- Deferred optional keys: [`../DO_THAT_LATER.md`](../DO_THAT_LATER.md)
