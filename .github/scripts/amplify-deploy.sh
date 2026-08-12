#!/usr/bin/env bash
# Amplify deploy by App ID from GitHub Secrets.
# - APP_ID set → update env/buildSpec + RELEASE (connects GitHub if GH_PAT set)
# - APP_ID empty → create app, print new ID, then RELEASE
set -euo pipefail

APP_ID="${APP_ID:-}"
APP_NAME="${APP_NAME:?APP_NAME required}"
APP_ROOT="${APP_ROOT:?APP_ROOT required}"
BRANCH_NAME="${AMPLIFY_BRANCH:-main}"
REPO_URL="${REPO_URL:-https://github.com/norvantechnology/Blinkit_eccomrce}"
API_URL="${API_PUBLIC_URL:-${API_FALLBACK:-}}"

build_spec_for_root() {
  local root="$1"
  cat <<EOF
version: 1
applications:
  - appRoot: ${root}
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
EOF
}

BUILD_SPEC="$(build_spec_for_root "${APP_ROOT}")"

if [ -n "${APP_ID}" ]; then
  echo "Using Amplify APP_ID from secrets: ${APP_ID}"
  if ! aws amplify get-app --app-id "${APP_ID}" >/dev/null 2>&1; then
    echo "ERROR: APP_ID=${APP_ID} not found in AWS (${AWS_DEFAULT_REGION:-default})."
    exit 1
  fi
else
  echo "No APP_ID — creating Amplify app ${APP_NAME}…"
  if [ -n "${GH_PAT:-}" ]; then
    APP_ID="$(aws amplify create-app \
      --name "${APP_NAME}" \
      --platform WEB_COMPUTE \
      --repository "${REPO_URL}" \
      --access-token "${GH_PAT}" \
      --build-spec "${BUILD_SPEC}" \
      --query 'app.appId' --output text)"
  else
    APP_ID="$(aws amplify create-app \
      --name "${APP_NAME}" \
      --platform WEB_COMPUTE \
      --build-spec "${BUILD_SPEC}" \
      --query 'app.appId' --output text)"
  fi
  echo "============================================================"
  echo " NEW Amplify App ID — save to GitHub Secrets:"
  echo "   ${APP_NAME} → ${APP_ID}"
  echo "============================================================"
fi

# Re-attach GitHub when PAT is available (needed for RELEASE jobs)
if [ -n "${GH_PAT:-}" ]; then
  echo "Ensuring Amplify app is connected to ${REPO_URL}…"
  aws amplify update-app \
    --app-id "${APP_ID}" \
    --repository "${REPO_URL}" \
    --access-token "${GH_PAT}" \
    --build-spec "${BUILD_SPEC}" \
    >/dev/null || true
else
  aws amplify update-app \
    --app-id "${APP_ID}" \
    --build-spec "${BUILD_SPEC}" \
    >/dev/null
fi

ENV_VARS="AMPLIFY_MONOREPO_APP_ROOT=${APP_ROOT}"
if [ -n "${API_URL}" ]; then
  API_BASE="${API_URL%/}"
  BACKEND_ORIGIN="${API_BASE%/api/v1}"
  PUBLIC_API="${BACKEND_ORIGIN}/api/v1"
  ENV_VARS="${ENV_VARS},NEXT_PUBLIC_API_URL=${PUBLIC_API},BACKEND_URL=${BACKEND_ORIGIN}"
fi
aws amplify update-app --app-id "${APP_ID}" --environment-variables "${ENV_VARS}" >/dev/null || true

BRANCH_EXISTS="$(aws amplify list-branches --app-id "${APP_ID}" \
  --query "branches[?branchName=='${BRANCH_NAME}'].branchName | [0]" \
  --output text 2>/dev/null | tr -d '\r' || true)"

if [ -z "${BRANCH_EXISTS}" ] || [ "${BRANCH_EXISTS}" = "None" ] || [ "${BRANCH_EXISTS}" = "null" ]; then
  aws amplify create-branch \
    --app-id "${APP_ID}" \
    --branch-name "${BRANCH_NAME}" \
    --stage PRODUCTION \
    --enable-auto-build \
    >/dev/null
fi

echo "Starting RELEASE on ${APP_ID} / ${BRANCH_NAME}…"
if ! JOB_ID="$(aws amplify start-job \
  --app-id "${APP_ID}" \
  --branch-name "${BRANCH_NAME}" \
  --job-type RELEASE \
  --query 'jobSummary.jobId' \
  --output text 2>&1)"; then
  echo "$JOB_ID"
  echo ""
  echo "Amplify RELEASE failed. Usually the app is not connected to GitHub."
  echo "Fix: add secret GH_PAT (classic token, repo scope), push code to main, re-run workflow."
  echo "Or in Amplify Console → app → connect repository → branch main."
  exit 1
fi

echo "Done. jobId=${JOB_ID}"
