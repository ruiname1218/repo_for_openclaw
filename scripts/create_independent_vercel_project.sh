#!/usr/bin/env bash
set -euo pipefail

# Create a new independent Vercel project for apps/<app-name>, then trigger a deploy.
# Usage:
#   VERCEL_TOKEN=... ./scripts/create_independent_vercel_project.sh <app-name> [repo_owner] [repo_name] [repo_id] [team_id]
# Example:
#   VERCEL_TOKEN=... ./scripts/create_independent_vercel_project.sh todo-app ruiname1218 repo_for_openclaw 1169333224

APP_NAME="${1:-}"
REPO_OWNER="${2:-ruiname1218}"
REPO_NAME="${3:-repo_for_openclaw}"
REPO_ID="${4:-1169333224}"
TEAM_ID="${5:-${VERCEL_TEAM_ID:-}}"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"

if [[ -z "$APP_NAME" ]]; then
  echo "Usage: VERCEL_TOKEN=... $0 <app-name> [repo_owner] [repo_name] [repo_id] [team_id]" >&2
  exit 1
fi
if [[ -z "$VERCEL_TOKEN" ]]; then
  echo "Missing VERCEL_TOKEN" >&2
  exit 1
fi
if [[ ! -d "apps/${APP_NAME}" ]]; then
  echo "App folder not found: apps/${APP_NAME}" >&2
  exit 2
fi

API_BASE="https://api.vercel.com"
TEAM_Q=""
if [[ -n "$TEAM_ID" ]]; then TEAM_Q="?teamId=${TEAM_ID}"; fi

PROJECT_NAME="${APP_NAME}-$(date +%m%d%H%M)"

CREATE_PAYLOAD=$(cat <<JSON
{
  "name": "${PROJECT_NAME}",
  "framework": null,
  "gitRepository": {
    "type": "github",
    "repo": "${REPO_OWNER}/${REPO_NAME}"
  }
}
JSON
)

CREATE_RESP=$(curl -sS -X POST "${API_BASE}/v10/projects${TEAM_Q}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$CREATE_PAYLOAD")
PROJECT_ID=$(python3 - <<'PY'
import json,sys
j=json.loads(sys.stdin.read())
if 'error' in j:
    print('ERROR:' + j['error'].get('message','unknown'))
else:
    print(j.get('id',''))
PY
<<<"$CREATE_RESP")

if [[ "$PROJECT_ID" == ERROR:* ]] || [[ -z "$PROJECT_ID" ]]; then
  echo "$CREATE_RESP" >&2
  exit 3
fi

PATCH_PAYLOAD=$(cat <<JSON
{"rootDirectory":"apps/${APP_NAME}","framework":null}
JSON
)

curl -sS -X PATCH "${API_BASE}/v9/projects/${PROJECT_ID}${TEAM_Q}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$PATCH_PAYLOAD" >/dev/null

SHA=$(git rev-parse HEAD)
DEPLOY_PAYLOAD=$(cat <<JSON
{
  "name": "${REPO_NAME}",
  "project": "${PROJECT_ID}",
  "target": "production",
  "gitSource": {
    "type": "github",
    "org": "${REPO_OWNER}",
    "repo": "${REPO_NAME}",
    "repoId": ${REPO_ID},
    "ref": "master",
    "sha": "${SHA}"
  }
}
JSON
)

DEPLOY_RESP=$(curl -sS -X POST "${API_BASE}/v13/deployments${TEAM_Q}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$DEPLOY_PAYLOAD")

DEPLOY_URL=$(python3 - <<'PY'
import json,sys
j=json.loads(sys.stdin.read())
if 'error' in j:
    print('ERROR:' + j['error'].get('message','unknown'))
else:
    print(j.get('url',''))
PY
<<<"$DEPLOY_RESP")

if [[ "$DEPLOY_URL" == ERROR:* ]] || [[ -z "$DEPLOY_URL" ]]; then
  echo "$DEPLOY_RESP" >&2
  exit 4
fi

echo "project_id=${PROJECT_ID}"
echo "deploy_url=https://${DEPLOY_URL}"
