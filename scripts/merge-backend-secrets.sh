#!/usr/bin/env bash
# Merge M1 keys into AWS Secrets Manager (run with an IAM user/role that has secretsmanager:* on tapi-grocery/backend).
set -euo pipefail

SECRET_ID="${SECRET_ID:-tapi-grocery/backend}"
REGION="${AWS_REGION:-ap-south-1}"
PATCH_FILE="${1:-backend/secrets-manager.m1-keys.json}"

if ! command -v jq >/dev/null 2>&1; then
  echo "Install jq first: sudo apt install jq"
  exit 1
fi

echo "Fetching current secret: ${SECRET_ID} (${REGION})..."
CURRENT="$(aws secretsmanager get-secret-value \
  --secret-id "${SECRET_ID}" \
  --region "${REGION}" \
  --query SecretString \
  --output text)"

PATCH="$(jq 'del(._comment)' "${PATCH_FILE}")"

# Merge: patch keys with non-empty values only (won't wipe existing Google/Apple/Maps keys)
MERGED="$(jq -s '.[0] * (.[1] | with_entries(select(.value != "" and .value != null)))' <<< "${CURRENT}"$'\n'"${PATCH}")"

echo "Updating secret (keys being set/updated):"
echo "${PATCH}" | jq 'keys'

aws secretsmanager put-secret-value \
  --secret-id "${SECRET_ID}" \
  --region "${REGION}" \
  --secret-string "${MERGED}"

echo "Done. Restart backend on EC2: docker compose restart backend (or redeploy via GitHub Actions)."
