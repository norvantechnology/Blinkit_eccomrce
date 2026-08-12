#!/usr/bin/env bash
# Trigger / ensure Amplify build for a monorepo app.
# - Does NOT change Amplify environment variables
# - If GitHub is already connected, only refreshes buildSpec + starts RELEASE
#   (or succeeds if a build is already running from the git push webhook)
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
            - npm install
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

is_active_status() {
  case "$1" in
    RUNNING|PENDING|PROVISIONING|CREATED|CANCELLING) return 0 ;;
    *) return 1 ;;
  esac
}

latest_job() {
  aws amplify list-jobs \
    --app-id "${APP_ID}" \
    --branch-name "${BRANCH_NAME}" \
    --max-items 5 \
    --query 'jobSummaries[0].{id:jobId,status:status}' \
    --output text 2>/dev/null | tr -d '\r' || true
}

BUILD_SPEC="$(build_spec_for_root "${APP_ROOT}")"

echo "Amplify APP_ID=${APP_ID} root=${APP_ROOT} branch=${BRANCH_NAME}"
aws amplify get-app --app-id "${APP_ID}" >/dev/null

REPO_CONNECTED="$(aws amplify get-app --app-id "${APP_ID}" \
  --query 'app.repository' --output text 2>/dev/null | tr -d '\r' || true)"

if [ -z "${REPO_CONNECTED}" ] || [ "${REPO_CONNECTED}" = "None" ] || [ "${REPO_CONNECTED}" = "null" ]; then
  if [ -z "${GH_PAT:-}" ]; then
    echo "ERROR: app is not connected to GitHub and GH_PAT is missing."
    exit 1
  fi

  echo "App is not connected to GitHub — preparing connection…"

  BRANCHES="$(aws amplify list-branches --app-id "${APP_ID}" \
    --query 'branches[].branchName' --output text 2>/dev/null | tr '\t' ' ' || true)"
  for b in ${BRANCHES}; do
    [ -z "$b" ] && continue
    echo "Deleting branch blocking connect: ${b}"
    aws amplify delete-branch --app-id "${APP_ID}" --branch-name "${b}" >/dev/null || true
  done
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
  # Refresh buildSpec only — do not re-bind repository (avoids BadRequestException)
  aws amplify update-app \
    --app-id "${APP_ID}" \
    --build-spec "${BUILD_SPEC}" \
    >/dev/null
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

# Git push webhook often already started a build — treat that as success.
LATEST="$(latest_job)"
LATEST_ID="$(echo "${LATEST}" | awk '{print $1}')"
LATEST_STATUS="$(echo "${LATEST}" | awk '{print $2}')"

if is_active_status "${LATEST_STATUS}"; then
  echo "Amplify job ${LATEST_ID} already ${LATEST_STATUS} (likely from git webhook) — OK"
  exit 0
fi

echo "Starting RELEASE…"
START_ERR="$(mktemp)"
set +e
JOB_ID="$(aws amplify start-job \
  --app-id "${APP_ID}" \
  --branch-name "${BRANCH_NAME}" \
  --job-type RELEASE \
  --query 'jobSummary.jobId' \
  --output text 2>"${START_ERR}")"
START_RC=$?
set -e

if [ "${START_RC}" -eq 0 ] && [ -n "${JOB_ID}" ] && [ "${JOB_ID}" != "None" ]; then
  echo "Done. jobId=${JOB_ID}"
  rm -f "${START_ERR}"
  exit 0
fi

ERR_TEXT="$(cat "${START_ERR}" 2>/dev/null || true)"
rm -f "${START_ERR}"
echo "start-job failed (rc=${START_RC}): ${ERR_TEXT}"

# LimitExceededException = another job is already pending/running (webhook race).
if echo "${ERR_TEXT}" | grep -qi 'LimitExceededException\|already have pending or running'; then
  LATEST="$(latest_job)"
  LATEST_ID="$(echo "${LATEST}" | awk '{print $1}')"
  LATEST_STATUS="$(echo "${LATEST}" | awk '{print $2}')"
  echo "Amplify already has a job in flight — OK (job ${LATEST_ID} ${LATEST_STATUS})"
  exit 0
fi

LATEST="$(latest_job)"
LATEST_ID="$(echo "${LATEST}" | awk '{print $1}')"
LATEST_STATUS="$(echo "${LATEST}" | awk '{print $2}')"
if is_active_status "${LATEST_STATUS}" || [ "${LATEST_STATUS}" = "SUCCEED" ]; then
  echo "Continuing with existing job ${LATEST_ID} (${LATEST_STATUS})"
  exit 0
fi

exit 1
