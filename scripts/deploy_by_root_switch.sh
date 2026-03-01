#!/usr/bin/env bash
set -euo pipefail

# Deploy by switching one Vercel project's rootDirectory to apps/<target-app>.
# Usage:
#   source .vercel.env
#   ./scripts/deploy_by_root_switch.sh <target-app> [project-id]

TARGET_APP="${1:-}"
PROJECT_ID="${2:-prj_LCyTPl4AmYUtPFROqO6xtKS7FAIj}"

if [[ -z "$TARGET_APP" ]]; then
  echo "Usage: source .vercel.env && $0 <target-app> [project-id]" >&2
  exit 1
fi
if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Missing VERCEL_TOKEN (source .vercel.env first)" >&2
  exit 1
fi
if [[ ! -d "apps/${TARGET_APP}" ]]; then
  echo "App folder not found: apps/${TARGET_APP}" >&2
  exit 2
fi

# 1) Switch rootDirectory to target app
curl -sS -X PATCH "https://api.vercel.com/v9/projects/${PROJECT_ID}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"rootDirectory\":\"apps/${TARGET_APP}\",\"framework\":null}" \
  > /tmp/vercel-root-switch.json

ROOT=$(python3 - <<'PY'
import json
j=json.load(open('/tmp/vercel-root-switch.json'))
print(j.get('rootDirectory',''))
PY
)
if [[ "$ROOT" != "apps/${TARGET_APP}" ]]; then
  echo "Failed to switch rootDirectory" >&2
  cat /tmp/vercel-root-switch.json >&2
  exit 3
fi

# 2) Push current branch (if ahead)
AHEAD=$(git status -sb | sed -n 's/.*ahead \([0-9]\+\).*/\1/p')
if [[ -n "$AHEAD" && "$AHEAD" != "0" ]]; then
  git push origin master
fi

# 3) Trigger production deploy from latest commit
SHA=$(git rev-parse HEAD)
DEPLOY_PAYLOAD=$(cat <<JSON
{
  "name": "repo-for-openclaw",
  "project": "${PROJECT_ID}",
  "target": "production",
  "gitSource": {
    "type": "github",
    "org": "ruiname1218",
    "repo": "repo_for_openclaw",
    "repoId": 1169333224,
    "ref": "master",
    "sha": "${SHA}"
  }
}
JSON
)

curl -sS -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$DEPLOY_PAYLOAD" > /tmp/vercel-root-switch-deploy.json

DEPLOY_URL=$(python3 - <<'PY'
import json
j=json.load(open('/tmp/vercel-root-switch-deploy.json'))
print(j.get('url',''))
PY
)
if [[ -z "$DEPLOY_URL" ]]; then
  echo "Deploy trigger failed" >&2
  cat /tmp/vercel-root-switch-deploy.json >&2
  exit 4
fi

echo "target_app=${TARGET_APP}"
echo "rootDirectory=apps/${TARGET_APP}"
echo "deploy_url=https://${DEPLOY_URL}"
