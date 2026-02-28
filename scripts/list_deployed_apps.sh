#!/usr/bin/env bash
set -euo pipefail

# List apps and latest deployment URLs from deploy/projects.json.
# If VERCEL_TOKEN is set, fetch live latest URL from Vercel API.
# Usage:
#   ./scripts/list_deployed_apps.sh
#   source .vercel.env && ./scripts/list_deployed_apps.sh

if [[ ! -f deploy/projects.json ]]; then
  echo "deploy/projects.json not found" >&2
  exit 1
fi

ROWS=$(python3 - <<'PY'
import json
from pathlib import Path
p=Path('deploy/projects.json')
j=json.loads(p.read_text(encoding='utf-8'))
apps=j.get('apps',{})
for name,meta in apps.items():
    print(name + '|' + (meta.get('vercelProjectId') or '') + '|' + (meta.get('latestDeploymentUrl') or ''))
PY
)

while IFS='|' read -r app project_id cached_url; do
  [[ -z "${app}" ]] && continue

  live_url=""
  state=""
  if [[ -n "${VERCEL_TOKEN:-}" && -n "$project_id" ]]; then
    URL="https://api.vercel.com/v6/deployments?projectId=${project_id}&limit=1"
    if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then URL+="&teamId=${VERCEL_TEAM_ID}"; fi
    RESP=$(curl -sS "$URL" -H "Authorization: Bearer ${VERCEL_TOKEN}" || true)
    PARSED=$(python3 - <<'PY' "$RESP"
import json,sys
raw=sys.argv[1]
try:
    j=json.loads(raw)
    d=(j.get('deployments') or [{}])[0]
    print((d.get('readyState') or d.get('state') or '') + '|' + ('https://' + d.get('url','') if d.get('url') else ''))
except Exception:
    print('|')
PY
)
    state="${PARSED%%|*}"
    live_url="${PARSED#*|}"
  fi

  final_url="$live_url"
  if [[ -z "$final_url" ]]; then final_url="$cached_url"; fi

  echo "- ${app}"
  echo "  projectId: ${project_id:-<not-set>}"
  echo "  latestUrl: ${final_url:-<unknown>}"
  if [[ -n "$state" ]]; then echo "  state: ${state}"; fi
  echo

done <<< "$ROWS"
