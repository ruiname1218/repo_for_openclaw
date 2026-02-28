# math-study-app

日本語UIのシンプルな算数学習アプリです。HTML/CSS/JavaScriptのみで動作します。

## 機能

- 4モード: たし算 / ひき算 / かけ算 / わり算
- 難易度: 初級 / 中級 / 上級（数値レンジ制御）
- 10問クイズ + タイマー
- 各回答ごとの即時フィードバックと解説
- セッション結果表示（スコア・時間・演算ごとの正答率）
- `localStorage` 保存
  - ベストスコア
  - 学習連続日数（streak）
  - ダークモード設定
- モバイルファーストのレスポンシブUI

## 実行方法

### 1) ファイルを直接開く

`index.html` をブラウザで開くだけで動作します。

### 2) 簡易ローカルサーバー（推奨）

```bash
cd /home/rui/.openclaw/workspace/apps/math-study-app
python3 -m http.server 8000
```

ブラウザで以下にアクセス:

- <http://localhost:8000>

## ファイル構成

- `index.html` - 画面構造
- `styles.css` - スタイル（ライト/ダーク対応）
- `script.js` - クイズロジック、タイマー、保存処理
