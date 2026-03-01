#!/usr/bin/env bash
set -euo pipefail

# Single-project deploy mode:
# Replace apps/vibe-app content with another app folder, push, and use one Vercel project.
# Usage:
#   ./scripts/deploy_single_project.sh <source-app-name> [commit-message]
# Example:
#   ./scripts/deploy_single_project.sh todo-app "deploy: todo-app -> vibe-app"

SRC_APP="${1:-}"
MSG="${2:-}"

if [[ -z "$SRC_APP" ]]; then
  echo "Usage: $0 <source-app-name> [commit-message]" >&2
  exit 1
fi

SRC_DIR="apps/${SRC_APP}"
DST_DIR="apps/vibe-app"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Source app not found: $SRC_DIR" >&2
  exit 2
fi

if [[ "$SRC_DIR" == "$DST_DIR" ]]; then
  echo "Source is already apps/vibe-app; just push changes normally." >&2
  exit 3
fi

# Replace destination contents
find "$DST_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a "$SRC_DIR"/. "$DST_DIR"/

if [[ -z "$MSG" ]]; then
  MSG="deploy: ${SRC_APP} -> vibe-app"
fi

git add "$DST_DIR"
if git diff --cached --quiet; then
  echo "No changes to deploy."
else
  git commit -m "$MSG"
fi

git push origin master

echo "Done: ${SRC_APP} deployed via apps/vibe-app (single-project mode)."
