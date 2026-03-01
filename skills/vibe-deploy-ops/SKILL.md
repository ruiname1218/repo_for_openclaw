---
name: vibe-deploy-ops
description: Deploy vibe-coded apps by switching a single Vercel project's rootDirectory to `apps/<target-app>` each run. Use when user asks to build an app and ship it automatically without creating new Vercel projects.
---

# Vibe Deploy Ops

## Default rule

Use **one Vercel project** and switch `rootDirectory` per deploy.

- Target project: `repo-for-openclaw` (`prj_LCyTPl4AmYUtPFROqO6xtKS7FAIj`)
- Deploy source: `apps/<target-app>`
- Do not create new Vercel projects unless user explicitly asks.

## Required automation when user says "アプリを作って"

1. Build app in `apps/<target-app>`.
2. Commit and push to `master`.
3. Switch Vercel `rootDirectory` to `apps/<target-app>` via API.
4. Trigger production deploy via API.
5. Return deployment URL to user.
6. Record URL/history in `memory/vibe-deploy-history.md`.

## Command

```bash
source .vercel.env
./scripts/deploy_by_root_switch.sh <target-app>
```

## List known app links

```bash
source .vercel.env
./scripts/list_deployed_apps.sh
```

## Notes

- This avoids project-count limits on Vercel free plans.
- Production URL always points to the most recently selected app.
- Older builds remain available via Vercel deployment-history URLs.
