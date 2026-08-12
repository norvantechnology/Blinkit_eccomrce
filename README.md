# Blinkit Clone (Single Store)

Monorepo for the Blinkit-clone quick-commerce platform — backend API + **customer User Web App** + admin panel.

Storefront brand: **Tapi Grocery** (Blinkit-parity UI chrome; DB slug `blinkit-store`).

> **Source of truth:** [`Blinkit.md`](./Blinkit.md) — full technical specification (**v2.7**)  
> **Implementation tracker:** [`Blinkit.md` §21](./Blinkit.md#21-implementation-status-current)  
> **M1 final audit:** [`MILESTONE_1_AUDIT.md`](./MILESTONE_1_AUDIT.md) — **CLOSED**  
> **Deploy / CI:** [`DEPLOY.md`](./DEPLOY.md) — one workflow deploys backend → user-web → admin (EC2 + Amplify)

## Structure

```
Blinkit/
├── docker-compose.yml      # PostGIS + Redis + backend API
├── backend/                # Node.js + Express + Prisma REST API
│   └── Dockerfile
├── user-web/               # Next.js customer storefront (Blinkit UI) — M1 done
├── admin-panel/            # Next.js Tapi Grocery admin dashboard
├── Blinkit.md              # Full spec + milestone status (v2.6)
├── MILESTONE_1_AUDIT.md
└── DO_THAT_LATER.md
```

## Prerequisites

- Node.js 18+
- Docker & Docker Compose

## Quick start (local dev)

```bash
# 1. Infrastructure (PostGIS :5433, Redis :6379)
docker compose up -d postgres redis

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Copy the `DEFAULT_STORE_ID` printed by seed into `backend/.env`. For easy OTP testing, keep `OTP_TEST_CODE=123456` in `backend/.env`.

```bash
# 3. Admin panel (new terminal) — :3000
cd admin-panel
cp .env.example .env.local
npm install
npm run dev
```

```bash
# 4. User web (new terminal) — :3001
cd user-web
cp .env.example .env.local
npm install
npm run dev
```

## Services & URLs

| Service | URL |
|---------|-----|
| API | http://localhost:4000 |
| API base path | `/api/v1` |
| Health | http://localhost:4000/health |
| **API Docs (Swagger)** | http://localhost:4000/api-docs |
| **API Docs (admin proxy)** | http://localhost:3000/api-docs |
| Admin panel | http://localhost:3000 |
| **User web** | http://localhost:3001 |
| PostGIS | `127.0.0.1:5433` — `postgres` / `postgres` / `blinkit` |
| Redis | `localhost:6379` |

## Default credentials (after seed)

| App | Field | Value |
|-----|-------|-------|
| Admin | Email | `admin@gmail.com` |
| Admin | Password | `admin@123` |
| User web (email) | Email | `rahul@example.com` |
| User web (email) | Password | `Customer@123` |
| User web (OTP) | Code | `OTP_TEST_CODE` from backend `.env` (default `123456`) or API console log |

## Docker (full stack)

```bash
# First time — create tables + seed
RUN_DB_SETUP=1 docker compose up -d --build

# Normal start
docker compose up -d
```

Dockerfile: [`backend/Dockerfile`](./backend/Dockerfile)

## Tests

```bash
cd backend && npm test
```

6 integration tests (OTP, refresh, Google OAuth, admin forgot/reset password, RBAC). Requires PostGIS + Redis running.

## Milestone 1 status

**CLOSED** (2026-08-08). Backend + admin shell + user-web M1. See [`MILESTONE_1_AUDIT.md`](./MILESTONE_1_AUDIT.md).

| Area | Status |
|------|--------|
| DB §6.1–§6.2 (10 tables) + GIST | Done |
| API §8.1–§8.3 + admin auth | Done |
| Admin panel shell + PermissionGate RBAC | Done |
| **User Web M1** (auth, account, addresses, Blinkit chrome) | **Done** |
| Swagger `/api-docs` | Done |
| Integration tests | **6/6 pass** |

## Next: Milestone 2

Product Catalogue, Search, Cart, Wishlist — API + User Web home/PDP/cart UI ([`Blinkit.md`](./Blinkit.md) §21.9).

## Optional API keys

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | Google Sign-In |
| `MAPS_API_KEY` | Address autocomplete (UI works without it) |
| `S3_BUCKET` + AWS keys | Product images (M2) |

See [`DO_THAT_LATER.md`](./DO_THAT_LATER.md).
