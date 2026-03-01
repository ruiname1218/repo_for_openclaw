#!/usr/bin/env bash
set -euo pipefail

# Create independent Vercel project for apps/<app-name>, deploy it, and log URL.
# Usage:
#   source .vercel.env
#   ./scripts/create_independent_vercel_project.sh <app-name> [repo_owner] [repo_name] [repo_id] [team_id]

APP_NAME="${1:-}"
REPO_OWNER="${2:-ruiname1218}"
REPO_NAME="${3:-repo_for_openclaw}"
REPO_ID="${4:-1169333224}"
TEAM_ID="${5:-${VERCEL_TEAM_ID:-}}"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"

if [[ -z "$APP_NAME" ]]; then
  echo "Usage: $0 <app-name> [repo_owner] [repo_name] [repo_id] [team_id]" >&2
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

retry_curl_json() {
  # retry_curl_json <max_attempts> <sleep_sec> <curl args...>
  local max_attempts="$1"; shift
  local sleep_sec="$1"; shift
  local attempt=1
  local out
  while :; do
    out=$(curl -sS "$@" || true)
    if [[ -n "$out" ]] && [[ "$out" != "" ]]; then
      # Retry on common transient API errors/rate limits
      if echo "$out" | grep -qiE '"(error|code)"\s*:\s*"?(rate_limited|too_many_requests|timeout|internal_server_error|bad_gateway|service_unavailable|gateway_timeout)"?|"status"\s*:\s*(429|500|502|503|504)'; then
        :
      else
        echo "$out"
        return 0
      fi
    fi
    if (( attempt >= max_attempts )); then
      echo "$out"
      return 1
    fi
    sleep "$sleep_sec"
    attempt=$((attempt+1))
  done
}

# 1) Create project
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

CREATE_RESP=$(retry_curl_json 5 2 -X POST "${API_BASE}/v10/projects${TEAM_Q}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$CREATE_PAYLOAD")

PROJECT_ID=$(python3 - <<'PY' "$CREATE_RESP"
import json,sys
raw=sys.argv[1]
try:
    j=json.loads(raw)
except Exception:
    print('')
    raise SystemExit(0)
if 'error' in j:
    print('ERROR:' + j['error'].get('message','unknown'))
else:
    print(j.get('id',''))
PY
)

if [[ "$PROJECT_ID" == ERROR:* ]] || [[ -z "$PROJECT_ID" ]]; then
  echo "Failed to create project" >&2
  echo "$CREATE_RESP" >&2
  exit 3
fi

# 2) Set root directory
PATCH_PAYLOAD="{\"rootDirectory\":\"apps/${APP_NAME}\",\"framework\":null}"
PATCH_RESP=$(retry_curl_json 5 2 -X PATCH "${API_BASE}/v9/projects/${PROJECT_ID}${TEAM_Q}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$PATCH_PAYLOAD")
PATCH_ROOT=$(python3 - <<'PY' "$PATCH_RESP"
import json,sys
j=json.loads(sys.argv[1])
print(j.get('rootDirectory',''))
PY
)
if [[ "$PATCH_ROOT" != "apps/${APP_NAME}" ]]; then
  echo "Failed to set rootDirectory" >&2
  echo "$PATCH_RESP" >&2
  exit 4
fi

# 3) Trigger deployment from current master commit
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
DEPLOY_RESP=$(retry_curl_json 6 3 -X POST "${API_BASE}/v13/deployments${TEAM_Q}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$DEPLOY_PAYLOAD")

DEPLOY_ID=$(python3 - <<'PY' "$DEPLOY_RESP"
import json,sys
j=json.loads(sys.argv[1])
if 'error' in j:
    print('ERROR:' + j['error'].get('message','unknown'))
else:
    print(j.get('id') or j.get('uid') or '')
PY
)
if [[ "$DEPLOY_ID" == ERROR:* ]] || [[ -z "$DEPLOY_ID" ]]; then
  echo "Failed to create deployment" >&2
  echo "$DEPLOY_RESP" >&2
  exit 5
fi

# 4) Poll until READY/ERROR
FINAL_URL=""
FINAL_STATE=""
for i in {1..40}; do
  STATUS_URL="${API_BASE}/v6/deployments?projectId=${PROJECT_ID}&limit=1"
  if [[ -n "$TEAM_ID" ]]; then STATUS_URL+="&teamId=${TEAM_ID}"; fi
  STATUS_RESP=$(retry_curl_json 4 2 "$STATUS_URL" -H "Authorization: Bearer ${VERCEL_TOKEN}")
  PARSED=$(python3 - <<'PY' "$STATUS_RESP"
import json,sys
j=json.loads(sys.argv[1])
d=(j.get('deployments') or [{}])[0]
print((d.get('readyState') or d.get('state') or 'UNKNOWN') + '|' + (d.get('url') or ''))
PY
)
  FINAL_STATE="${PARSED%%|*}"
  FINAL_URL="${PARSED#*|}"
  if [[ "$FINAL_STATE" == "READY" || "$FINAL_STATE" == "ERROR" ]]; then
    break
  fi
  sleep 3
done

if [[ -z "$FINAL_URL" ]]; then
  echo "Failed to fetch deployment URL" >&2
  exit 6
fi

# 5) Update local registry
python3 - <<'PY' "$APP_NAME" "$PROJECT_ID" "$FINAL_URL"
import json,sys
app,project_id,url=sys.argv[1:]
p='deploy/projects.json'
with open(p,'r',encoding='utf-8') as f:
    j=json.load(f)
apps=j.setdefault('apps',{})
entry=apps.setdefault(app,{})
entry.update({
  'repo':'ruiname1218/repo_for_openclaw',
  'branch':'master',
  'rootDirectory':f'apps/{app}',
  'vercelProjectId':project_id,
  'latestDeploymentUrl':'https://' + url,
  'notes':'Independent Vercel project managed by create_independent_vercel_project.sh'
})
with open(p,'w',encoding='utf-8') as f:
    json.dump(j,f,ensure_ascii=False,indent=2)
    f.write('\n')
PY

# 6) Append history log
TIME_JST=$(TZ=Asia/Tokyo date '+%Y-%m-%d %H:%M')
COMMIT=$(git rev-parse --short HEAD)
mkdir -p memory
cat >> memory/vibe-deploy-history.md <<EOF

- Date (JST): ${TIME_JST}
- App name: ${APP_NAME}
- Commit: ${COMMIT}
- Production URL: (project default domain)
- Deployment URL: https://${FINAL_URL}
- Notes: Independent project created and deployed via API (state: ${FINAL_STATE}).
EOF

echo "project_id=${PROJECT_ID}"
echo "deploy_state=${FINAL_STATE}"
echo "deploy_url=https://${FINAL_URL}"
