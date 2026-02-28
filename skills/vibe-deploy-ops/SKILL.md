---
name: vibe-deploy-ops
description: Maintain a single fast vibe-coding deploy pipeline to Vercel using the `vibe-app` folder in `ruiname1218/repo_for_openclaw`. Use when creating, replacing, or shipping a quick web app, and when logging Vercel deployment URLs so older apps remain accessible.
---

# Vibe Deploy Ops

## Overview

Use this skill to ship rapid web app iterations to one Vercel project by replacing `vibe-app`, pushing to `master`, and recording the resulting deployment URL with a human-readable app label.

## Workflow

1. Build or replace the app inside `vibe-app/` only.
2. Keep repo deploy-safe:
   - Do not commit local-only folders (for example `ios-openclaw-api/`, `.openclaw/`).
   - Keep deploy content scoped to `vibe-app/`.
3. Commit and push:
   - `git add -A`
   - `git commit -m "<app name>: <short change>"`
   - `git push origin master`
4. Confirm Vercel auto-deploy triggered.
5. Save deployment history entry in `memory/vibe-deploy-history.md` with:
   - date/time (JST)
   - app name
   - commit hash
   - production URL
   - deployment URL (history URL)
   - short notes

## Required conventions

- Deploy folder name is always `vibe-app`.
- Production branch is `master`.
- Preserve old app access by storing Vercel deployment-history URLs each time.
- If Vercel root directory drifts, set it back to `vibe-app`.

## Quick checklist

- `vibe-app` updated
- commit pushed
- Vercel deployment green
- history URL recorded in `memory/vibe-deploy-history.md`
