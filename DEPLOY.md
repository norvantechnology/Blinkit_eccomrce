# Deployment — Tapi Grocery

## GitHub Secrets (required)

| Secret | Notes |
|--------|--------|
| `EC2_SSH_KEY` | Full PEM file contents |
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret |
| `AWS_REGION` | `ap-south-1` |
| `AMPLIFY_APP_ID_USER_WEB` | e.g. `d14bykpxg1lhlf` |
| `AMPLIFY_APP_ID_ADMIN` | e.g. `d2wf1d5bejg599` |
| `GH_PAT` | Classic PAT with `repo` (Amplify GitHub pull) |

**Not needed:** `EC2_HOST`, `EC2_USER`, `EC2_APP_DIR`, `AMPLIFY_BRANCH` (hardcoded / auto-discovered).

Optional: `API_PUBLIC_URL` — otherwise uses `http://<ec2-ip>:4000`.

## Behaviour

1. Backend → EC2 (`Name=tapi-grocery-api`, user `ubuntu`, path `/opt/blinkit`)
2. User web → Amplify (`APP_ID` set = update; empty = create)
3. Admin → Amplify (same)

Branch for Amplify builds: always `main`.

## Redeploy

Push to `main` or run **Actions → Deploy All**.
