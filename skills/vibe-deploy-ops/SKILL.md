---
name: vibe-deploy-ops
description: Run Vercel deployments for vibe-coding apps. Default mode is single-project deployment using `apps/vibe-app` (overwrite each release), with optional independent per-app deployment when explicitly requested.
---

# Vibe Deploy Ops

## Default mode (single-project)

Use one Vercel project and deploy by replacing `apps/vibe-app` each time.

Workflow:
1. Build app in `apps/<app-name>`.
2. Copy that app into `apps/vibe-app`.
3. Commit + push to `master`.
4. Vercel auto-deploys from `apps/vibe-app` root.
5. Return production URL and record deployment history.

Helper command:
```bash
./scripts/deploy_single_project.sh <source-app-name> [commit-message]
```

## Optional mode (independent project per app)

Use only when user explicitly asks for independent URLs per app.

```bash
source .vercel.env
./scripts/create_independent_vercel_project.sh <app-name>
```

## Listing

```bash
# live state/url (needs token)
source .vercel.env
./scripts/list_deployed_apps.sh

# cached only
./scripts/list_deployed_apps.sh
```

## Required conventions

- Production branch: `master`
- Single-project default root: `apps/vibe-app`
- Keep deployment logs in `memory/vibe-deploy-history.md`
