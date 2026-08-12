#!/usr/bin/env bash
# Deploy a monorepo app folder to Amplify Hosting (WEB_COMPUTE / Next.js).
# - Connects GitHub if GH_PAT is set (required for RELEASE builds)
# - Does NOT modify Amplify environment variables (edit those in Console)
set -euo pipefail

APP_ID="${APP_ID:?APP_ID required (GitHub secret AMPLIFY_APP_ID_*)}"
APP_ROOT="${APP_ROOT:?APP_ROOT required}"
BRANCH_NAME="${AMPLIFY_BRANCH:-main}"
REPO_URL="${REPO_URL:-https://github.com/norvantechnology/Blinkit_eccomrce}"

if [ -z "${GH_PAT:-}" ]; then
  echo "ERROR: GH_PAT is required to connect Amplify to GitHub and run RELEASE."
  exit 1
fi

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

echo "Amplify APP_ID=${APP_ID} root=${APP_ROOT} branch=${BRANCH_NAME}"
aws amplify get-app --app-id "${APP_ID}" >/dev/null

REPO_CONNECTED="$(aws amplify get-app --app-id "${APP_ID}" \
  --query 'app.repository' --output text 2>/dev/null | tr -d '\r' || true)"

if [ -z "${REPO_CONNECTED}" ] || [ "${REPO_CONNECTED}" = "None" ] || [ "${REPO_CONNECTED}" = "null" ]; then
  echo "App is not connected to GitHub — preparing connection…"

  # Manual branches block update-app --repository; remove them first.
  BRANCHES="$(aws amplify list-branches --app-id "${APP_ID}" \
    --query 'branches[].branchName' --output text 2>/dev/null | tr '\t' ' ' || true)"

  for b in ${BRANCHES}; do
    [ -z "$b" ] && continue
    echo "Deleting manual branch: ${b}"
    aws amplify delete-branch --app-id "${APP_ID}" --branch-name "${b}" >/dev/null || true
  done

  # Brief wait for Amplify to settle after branch deletes
  sleep 5

  echo "Connecting repository ${REPO_URL}…"
  aws amplify update-app \
    --app-id "${APP_ID}" \
    --repository "${REPO_URL}" \
    --access-token "${GH_PAT}" \
    --build-spec "${BUILD_SPEC}" \
    >/dev/null
else
  echo "Repo already connected: ${REPO_CONNECTED}"
  aws amplify update-app \
    --app-id "${APP_ID}" \
    --access-token "${GH_PAT}" \
    --build-spec "${BUILD_SPEC}" \
    >/dev/null || true
fi

BRANCH_EXISTS="$(aws amplify list-branches --app-id "${APP_ID}" \
  --query "branches[?branchName=='${BRANCH_NAME}'].branchName | [0]" \
  --output text 2>/dev/null | tr -d '\r' || true)"

if [ -z "${BRANCH_EXISTS}" ] || [ "${BRANCH_EXISTS}" = "None" ] || [ "${BRANCH_EXISTS}" = "null" ]; then
  echo "Creating branch ${BRANCH_NAME}…"
  aws amplify create-branch \
    --app-id "${APP_ID}" \
    --branch-name "${BRANCH_NAME}" \
    --stage PRODUCTION \
    --enable-auto-build \
    >/dev/null
  sleep 3
fi

echo "Starting RELEASE…"
JOB_ID="$(aws amplify start-job \
  --app-id "${APP_ID}" \
  --branch-name "${BRANCH_NAME}" \
  --job-type RELEASE \
  --query 'jobSummary.jobId' \
  --output text)"

echo "Done. jobId=${JOB_ID}"
