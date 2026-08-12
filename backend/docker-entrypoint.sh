#!/bin/sh
set -e

echo "Starting Tapi Grocery backend..."

# Empty AWS key env vars break the default credential chain (EC2 instance role).
if [ -z "${AWS_ACCESS_KEY_ID:-}" ]; then unset AWS_ACCESS_KEY_ID; fi
if [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then unset AWS_SECRET_ACCESS_KEY; fi
if [ -z "${AWS_SESSION_TOKEN:-}" ]; then unset AWS_SESSION_TOKEN; fi

# App config loads inside Node from Secrets Manager (no .env).

exec "$@"
