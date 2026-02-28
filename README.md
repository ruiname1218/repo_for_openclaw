# repo_for_openclaw

このリポジトリは、OpenClawで作るWebアプリをアプリ単位で独立デプロイするための構成です。

## Directory Layout

- `apps/<app-name>/`  各Webアプリ本体
  - `apps/vibe-app`
  - `apps/todo-app`
  - `apps/kakeibo-app`
- `deploy/projects.json`  アプリ名とVercel Project IDの対応表
- `scripts/`  デプロイ補助スクリプト
  - `create_independent_vercel_project.sh`
  - `vercel_fetch_latest.sh`
  - `log_deploy.sh`
  - `new_app_scaffold.sh`
- `memory/vibe-deploy-history.md`  デプロイ履歴ログ
- `skills/vibe-deploy-ops/`  この運用ルールのスキル

## 運用ルール

1. 新しいアプリは必ず `apps/<app-name>` に作る
2. アプリごとにVercelプロジェクトを分ける（独立URL）
3. デプロイ後にURLを履歴へ記録する
