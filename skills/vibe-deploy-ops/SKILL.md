---
name: vibe-deploy-ops
description: Run independent multi-app Vercel deployments from one repo using `apps/<app-name>` roots, with one Vercel project per app. Use when creating a new vibe-coded app, shipping updates, and logging deployment-history URLs so old versions remain accessible.
---

# Vibe Deploy Ops

## Overview

Use this skill to maintain independent app deployments. Each app lives in `apps/<app-name>` and maps to its own Vercel project. Pushes to `master` trigger auto-deploy per project/root mapping.

## Standard workflow

1. Create or update app in `apps/<app-name>`.
2. Ensure app mapping exists in `deploy/projects.json` (`rootDirectory`, `vercelProjectId`).
3. Commit and push:
   - `git add -A`
   - `git commit -m "<app-name>: <short change>"`
   - `git push origin master`
4. Fetch latest deployment URL:
   - `VERCEL_TOKEN=... ./scripts/vercel_fetch_latest.sh <project_id> [team_id]`
5. Log deployment entry:
   - `VERCEL_TOKEN=... ./scripts/log_deploy.sh <app-name> <project_id> [team_id]`

## New app workflow

1. Scaffold from baseline:
   - `./scripts/new_app_scaffold.sh <new-app-name>`
2. Create/import a new Vercel project for `apps/<new-app-name>` root.
3. Add mapping in `deploy/projects.json`.
4. Push to `master`.
5. Log deployment URL.

## Required conventions

- Repo keeps deployable web apps under `apps/`.
- One app = one Vercel project (independent URL/lifecycle).
- Production branch is `master`.
- Always preserve deployment-history URLs in `memory/vibe-deploy-history.md`.

## Quick checklist

- app updated under `apps/<app-name>`
- mapping present in `deploy/projects.json`
- push completed
- latest deployment URL captured
- history entry recorded
