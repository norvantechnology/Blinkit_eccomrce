# Tapi Grocery Admin Panel

Next.js (App Router) admin dashboard for the **Tapi Grocery** single-store platform.

> Full spec: [`../Blinkit.md`](../Blinkit.md) **v2.6** · Implementation status: [§21](../Blinkit.md#21-implementation-status-current)

Brand colors match the user web app (yellow `#F8CB46` + green `#0C831F`).

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Default login (after backend seed)

| Field | Value |
|-------|-------|
| Email | `admin@gmail.com` |
| Password | `admin@123` |

## URLs

| Page | URL |
|------|-----|
| Login | http://localhost:3000/login |
| Dashboard | http://localhost:3000/dashboard |
| API Docs (proxied) | http://localhost:3000/api-docs |

## Environment

| Variable | Default |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` |
| `BACKEND_URL` | `http://localhost:4000` |

## Milestone 1 features

- Login, forgot/reset password
- JWT session (localStorage + cookies)
- Auto token refresh (8 h access, 30 d refresh)
- RBAC-filtered sidebar navigation
- Mobile-responsive layout
- Placeholder pages for Milestone 2+ modules

## Not yet implemented

Dashboard KPIs, catalog CRUD, orders, reports, and all other admin module content — see Milestone 4 in `Blinkit.md`.
