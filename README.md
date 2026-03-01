# repo_for_openclaw

OpenClawで作るWebアプリをまとめるリポジトリです。
現在は **1つのVercelプロジェクトを使い回し**、`rootDirectory` を `apps/<target-app>` に切り替えてデプロイします。

## ディレクトリ構成

- `apps/<app-name>/` 各アプリ本体
- `deploy/projects.json` デプロイ設定と履歴メタ情報
- `scripts/` デプロイ補助スクリプト
  - `deploy_by_root_switch.sh`（デフォルト運用）
  - `list_deployed_apps.sh`
  - `new_app_scaffold.sh`
  - （必要時）`create_independent_vercel_project.sh` など
- `memory/vibe-deploy-history.md` デプロイURL履歴
- `skills/vibe-deploy-ops/` 運用スキル

## 標準運用（デフォルト）

1. `apps/<target-app>` にアプリを作る
2. `master` へpush
3. Vercel APIで `rootDirectory=apps/<target-app>` に切り替え
4. デプロイ実行
5. URLを返却し、履歴に保存

## よく使うコマンド

```bash
# rootDirectory切り替えデプロイ
source .vercel.env
./scripts/deploy_by_root_switch.sh <target-app>

# 既知アプリのURL一覧
source .vercel.env
./scripts/list_deployed_apps.sh
```
