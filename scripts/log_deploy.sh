#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   VERCEL_TOKEN=... ./scripts/log_deploy.sh <app_name> <project_id> [team_id]

APP_NAME="${1:-}"
PROJECT_ID="${2:-}"
TEAM_ID="${3:-${VERCEL_TEAM_ID:-}}"

if [[ -z "$APP_NAME" || -z "$PROJECT_ID" ]]; then
  echo "Usage: VERCEL_TOKEN=... $0 <app_name> <project_id> [team_id]" >&2
  exit 1
fi

DEPLOY_URL=$(VERCEL_TEAM_ID="$TEAM_ID" ./scripts/vercel_fetch_latest.sh "$PROJECT_ID" "$TEAM_ID" | head -n 1)
COMMIT=$(git rev-parse --short HEAD)
TIME_JST=$(TZ=Asia/Tokyo date '+%Y-%m-%d %H:%M')

mkdir -p memory
cat >> memory/vibe-deploy-history.md <<EOF

- Date (JST): ${TIME_JST}
- App name: ${APP_NAME}
- Commit: ${COMMIT}
- Production URL: (project default domain)
- Deployment URL: ${DEPLOY_URL}
- Notes: auto-logged by scripts/log_deploy.sh
EOF

echo "Logged: ${APP_NAME} -> ${DEPLOY_URL}"
