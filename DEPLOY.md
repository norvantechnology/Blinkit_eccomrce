# Deployment — Tapi Grocery

## Why not EC2_HOST / EC2_USER / EC2_APP_DIR / AMPLIFY_BRANCH?

| Old secret | Now |
|------------|-----|
| `EC2_HOST` | Auto from AWS: running instance tagged `Name=tapi-grocery-api` |
| `EC2_USER` | Hardcoded `ubuntu` |
| `EC2_APP_DIR` | Hardcoded `/opt/blinkit` |
| `AMPLIFY_BRANCH` | Hardcoded `main` |
| `EC2_SSH_KEY` | **Still required** — this *is* your `.pem` file contents (GitHub has no local file access) |

---

## GitHub Secrets (only these)

| Secret | What |
|--------|------|
| `EC2_SSH_KEY` | Full PEM (`-----BEGIN…` through `-----END…`) from `~/.blinkit-aws-deploy/tapi-grocery-ec2-20260812.pem` |
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret |
| `AWS_REGION` | `ap-south-1` |
| `AMPLIFY_APP_ID_USER_WEB` | `d14bykpxg1lhlf` (update if set; create if empty) |
| `AMPLIFY_APP_ID_ADMIN` | `d2wf1d5bejg599` (update if set; create if empty) |
| `GH_PAT` | GitHub classic PAT (`repo`) — Amplify must pull the repo to build |

Optional: `API_PUBLIC_URL` — if omitted, workflow uses `http://<ec2-ip>:4000`.

---

## Live (ap-south-1)

| Resource | Value |
|----------|--------|
| EC2 Name tag | `tapi-grocery-api` |
| API | http://35.154.74.19:4000/health |
| Amplify user-web | `d14bykpxg1lhlf` |
| Amplify admin | `d2wf1d5bejg599` |

Admin seed: `admin@gmail.com` / `admin@123`

## Redeploy

Push to `main` or **Actions → Deploy All**.
