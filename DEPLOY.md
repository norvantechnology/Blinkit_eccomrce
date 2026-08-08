# Deployment guide — Tapi Grocery / Blinkit_eccomrce

Spec reference: [`Blinkit.md`](./Blinkit.md) §13 (CI/CD: GitHub Actions → backend on **EC2**; user-web + admin-panel on **AWS Amplify** / ECS).

## Pipelines

| Workflow | Path | Trigger | Target |
|----------|------|---------|--------|
| Backend → EC2 | `.github/workflows/deploy-backend-ec2.yml` | Push `main` (backend/**, compose, workflow) or manual | EC2 Docker |
| User web → Amplify | `.github/workflows/deploy-user-web.yml` | Push `main` (`user-web/**`) or manual | AWS Amplify |
| Admin panel → Amplify | `.github/workflows/deploy-admin-panel.yml` | Push `main` (`admin-panel/**`) or manual | AWS Amplify |
| CI | `.github/workflows/ci.yml` | PR / push | Lint + backend tests |

---

## GitHub Secrets to add

Repo → **Settings → Secrets and variables → Actions → New repository secret**

### Shared AWS (Amplify + optional S3)

| Secret | Required | Description |
|--------|----------|-------------|
| `AWS_ACCESS_KEY_ID` | Yes (frontends) | IAM user with Amplify deploy + (optional) S3 |
| `AWS_SECRET_ACCESS_KEY` | Yes (frontends) | Matching secret key |
| `AWS_REGION` | Yes | e.g. `ap-south-1` |

### Backend → EC2

| Secret | Required | Description |
|--------|----------|-------------|
| `EC2_HOST` | Yes | Public IP or DNS of the EC2 instance |
| `EC2_USER` | Yes | SSH user, usually `ubuntu` or `ec2-user` |
| `EC2_SSH_KEY` | Yes | **Full private key** PEM contents (`-----BEGIN…`) |
| `EC2_APP_DIR` | No | Absolute path on server (default `/opt/blinkit`) |
| `EC2_PORT` | No | SSH port (default `22`) |

### Amplify apps (create two Amplify Hosting apps connected to this repo)

| Secret | Required | Description |
|--------|----------|-------------|
| `AMPLIFY_APP_ID_USER_WEB` | Yes | Amplify App ID for `user-web` |
| `AMPLIFY_APP_ID_ADMIN` | Yes | Amplify App ID for `admin-panel` |
| `AMPLIFY_BRANCH` | No | Branch name (default `main`) |

### Optional — bake into Amplify env (Amplify Console → App → Environment variables)

| Variable | App | Example |
|----------|-----|---------|
| `NEXT_PUBLIC_API_URL` | user-web, admin | `https://api.yourdomain.com/api/v1` |
| `BACKEND_URL` | user-web, admin | `https://api.yourdomain.com` |

Set these in the **Amplify Console** (not only GitHub), so builds get the production API URL.

---

## Environment variables on the EC2 host

Create `/opt/blinkit/backend/.env` on the server (never commit). Minimum for M1:

```bash
DATABASE_URL=postgresql://USER:PASS@HOST:5432/blinkit?schema=public
REDIS_URL=redis://127.0.0.1:6379
JWT_ACCESS_SECRET=<long-random>
JWT_REFRESH_SECRET=<long-random>
JWT_ACCESS_EXPIRY=15m
JWT_ADMIN_ACCESS_EXPIRY=8h
JWT_REFRESH_EXPIRY=30d
PORT=4000
NODE_ENV=production
API_BASE_URL=https://api.yourdomain.com
SUPER_ADMIN_EMAIL=admin@gmail.com
SUPER_ADMIN_PASSWORD=<strong-password>
SUPER_ADMIN_NAME=Super Admin
AUDIT_RETENTION_DAYS=5
AWS_REGION=ap-south-1
# Optional later:
# GOOGLE_CLIENT_ID=
# MAPS_API_KEY=
# S3_BUCKET=
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# SES_FROM_EMAIL=
# ADMIN_PANEL_URL=https://admin.yourdomain.com
```

Use `docker compose` on EC2 (Postgres + Redis + backend) or point `DATABASE_URL` / `REDIS_URL` at managed RDS / ElastiCache.

---

## One-time EC2 setup (outline)

1. Ubuntu 22.04 EC2, security group: `22` (your IP), `80`, `443`, `4000` (or only 80/443 via Nginx).
2. Install Docker + Compose plugin.
3. Clone this repo to `/opt/blinkit` (or set `EC2_APP_DIR`).
4. Copy `backend/.env` with production values.
5. `docker compose up -d` (or let the GitHub Action do `pull` + `up --build`).
6. Point Nginx/HTTPS at container port `4000`.

---

## One-time Amplify setup (outline)

1. AWS Amplify → Host web app → connect `norvantechnology/Blinkit_eccomrce`.
2. App 1: root `user-web`, build `npm ci && npm run build`, output `.next` (or Amplify Next.js defaults).
3. App 2: root `admin-panel`, same.
4. Set `NEXT_PUBLIC_API_URL` / `BACKEND_URL` in each app’s env.
5. Copy App IDs into GitHub secrets above.

---

## Local git identity (this repo only)

Already configured for commits:

- **Name:** `norvantechnology`
- **Email:** `norvantechnology@gmail.com`
