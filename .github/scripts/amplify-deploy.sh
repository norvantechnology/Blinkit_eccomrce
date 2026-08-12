#!/usr/bin/env bash
# Trigger Amplify RELEASE for an existing app. Does NOT change env vars
# (edit those manually in Amplify Console).
set -euo pipefail

APP_ID="${APP_ID:?APP_ID required (GitHub secret AMPLIFY_APP_ID_*)}"
APP_ROOT="${APP_ROOT:?APP_ROOT required}"
BRANCH_NAME="${AMPLIFY_BRANCH:-main}"
REPO_URL="${REPO_URL:-https://github.com/norvantechnology/Blinkit_eccomrce}"

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

# Keep monorepo buildSpec in sync with code; do not touch environmentVariables
if [ -n "${GH_PAT:-}" ]; then
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

echo "Starting RELEASE…"
JOB_ID="$(aws amplify start-job \
  --app-id "${APP_ID}" \
  --branch-name "${BRANCH_NAME}" \
  --job-type RELEASE \
  --query 'jobSummary.jobId' \
  --output text)"

echo "Done. jobId=${JOB_ID}"
