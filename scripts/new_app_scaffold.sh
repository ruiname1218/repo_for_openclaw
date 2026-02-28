#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/new_app_scaffold.sh <new-app-name>
# Creates apps/<new-app-name> by copying apps/vibe-app as a starting point.

APP_NAME="${1:-}"
if [[ -z "$APP_NAME" ]]; then
  echo "Usage: $0 <new-app-name>" >&2
  exit 1
fi

SRC="apps/vibe-app"
DST="apps/${APP_NAME}"

if [[ ! -d "$SRC" ]]; then
  echo "Template source not found: $SRC" >&2
  exit 2
fi

if [[ -e "$DST" ]]; then
  echo "Destination already exists: $DST" >&2
  exit 3
fi

mkdir -p apps
cp -R "$SRC" "$DST"
echo "Created: $DST"
echo "Next: add Vercel project for this folder and register it in deploy/projects.json"
