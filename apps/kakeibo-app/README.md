# 家計簿トラッカー (kakeibo-app)

シンプルな **HTML/CSS/JavaScriptのみ** で作成した家計簿Webアプリです。

## 主な機能

- 収入 / 支出の追加（日時、カテゴリ、メモ、金額）
- 明細一覧表示（編集 / 削除）
- 月次サマリー（収入・支出・残高）
- 支出カテゴリ内訳
- `localStorage` によるデータ保存
- CSVエクスポート / CSVインポート
- モバイルファーストのレスポンシブUI
- ダークモード切替

## 使い方

### 1) ファイルを開く

以下をブラウザで開きます。

- `index.html`

例:

```bash
cd /home/rui/.openclaw/workspace/kakeibo-app
python3 -m http.server 8080
```

その後、ブラウザで `http://localhost:8080` にアクセス。

> ※ `index.html` を直接ダブルクリックして開いても動作します。

### 2) 明細を登録する

1. 種別（支出 / 収入）を選択
2. 日付、カテゴリ、メモ、金額を入力
3. 「追加」を押す

### 3) 編集 / 削除

- 一覧の「編集」でフォームに読み込み
- 「更新」で保存
- 「削除」で該当明細を削除

### 4) CSV

- **CSVエクスポート**: 現在のデータをCSVで保存
- **CSVインポート**: 既存データに取り込み（同一idは上書き）

CSV列順:

```text
id,type,date,category,memo,amount
```

`type` は `income` または `expense` を想定しています。
