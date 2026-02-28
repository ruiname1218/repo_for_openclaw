---
name: vibe-deploy-ops
description: Run fully automated independent Vercel deployments from one repo using `apps/<app-name>`, with one Vercel project per app and one URL per app. Use when creating/shipping vibe-coded web apps and when listing existing app URLs.
---

# Vibe Deploy Ops

## Overview

Use this skill to keep every app independent:
- source lives in `apps/<app-name>`
- each app has its own Vercel project
- each app keeps its own URL

Never use overwrite-only single-project deployment as the default workflow.

## Automation contract

When the user asks to create an app, do all of this by default:
1. Build app in `apps/<app-name>`.
2. Commit and push to `master`.
3. Create independent Vercel project by API.
4. Set project `rootDirectory` to `apps/<app-name>`.
5. Trigger deployment and wait for result.
6. Record project id + URL in `deploy/projects.json` and `memory/vibe-deploy-history.md`.
7. Reply with the final app URL.

## Commands

### Create independent project + deploy

```bash
source .vercel.env
./scripts/create_independent_vercel_project.sh <app-name>
```

### List all apps with URLs

```bash
# with live state/url from Vercel API
source .vercel.env
./scripts/list_deployed_apps.sh

# offline (cached urls from deploy/projects.json)
./scripts/list_deployed_apps.sh
```

### Scaffold a new app from baseline

```bash
./scripts/new_app_scaffold.sh <new-app-name>
```

## Required conventions

- Keep deployable apps under `apps/` only.
- One app = one Vercel project = one independent URL.
- Keep production branch on `master`.
- Persist deployment URLs in `memory/vibe-deploy-history.md`.
- Keep `deploy/projects.json` up to date.
