#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   VERCEL_TOKEN=... ./scripts/vercel_fetch_latest.sh <project_id> [team_id]

PROJECT_ID="${1:-}"
TEAM_ID="${2:-${VERCEL_TEAM_ID:-}}"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Usage: VERCEL_TOKEN=... $0 <project_id> [team_id]" >&2
  exit 1
fi

if [[ -z "$VERCEL_TOKEN" ]]; then
  echo "Missing VERCEL_TOKEN" >&2
  exit 1
fi

URL="https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}&limit=1"
if [[ -n "$TEAM_ID" ]]; then
  URL+="&teamId=${TEAM_ID}"
fi

RESP=$(curl -sS "$URL" -H "Authorization: Bearer ${VERCEL_TOKEN}")
if ! echo "$RESP" | grep -q '"deployments"'; then
  echo "$RESP" >&2
  exit 2
fi

DEPLOY_URL=$(echo "$RESP" | sed -n 's/.*"url":"\([^"]*\)".*/\1/p' | head -n 1)
STATE=$(echo "$RESP" | sed -n 's/.*"readyState":"\([^"]*\)".*/\1/p' | head -n 1)

if [[ -z "$DEPLOY_URL" ]]; then
  echo "Could not parse deployment URL" >&2
  echo "$RESP" >&2
  exit 3
fi

echo "https://${DEPLOY_URL}"
echo "state=${STATE}" >&2
