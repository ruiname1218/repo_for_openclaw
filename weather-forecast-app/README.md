# 天気予報アプリ（weather-forecast-app）

Open-Meteo API（無料・APIキー不要）を使った、シンプルな日本語UIの天気予報Webアプリです。

## 機能

- 都市名検索（東京 / 大阪 / 京都 + 英語表記の Tokyo / Osaka / Kyoto）
- 現在の天気表示
  - 天気ラベル・アイコン（weather code マッピング）
  - 気温、体感温度、風速、降水量
- 今日・明日の予報
  - 最高/最低気温、降水量、最大風速
- 次の12時間の時間別予報（取得可能な場合）
- モバイルファーストのレスポンシブデザイン
- ダークモード切替
- 最近の検索履歴（localStorage、最大5件）
- ローディング表示・エラーハンドリング

## ファイル構成

- `index.html` - 画面構造
- `styles.css` - スタイル（ライト/ダークテーマ含む）
- `app.js` - API取得、描画、状態管理

## 実行方法

ビルドツール不要です。以下のどちらかで起動できます。

### 方法1: ファイルを直接開く

`index.html` をブラウザで開く。

### 方法2: 簡易HTTPサーバーで開く（推奨）

```bash
cd weather-forecast-app
python3 -m http.server 8000
```

その後、ブラウザで `http://localhost:8000` を開く。

## 対応都市について

このバージョンは最低要件として、以下を固定マッピングで対応しています。

- 東京 / Tokyo
- 大阪 / Osaka
- 京都 / Kyoto

未対応の都市名を入力した場合は、エラーメッセージを表示します。

## API

- Forecast API: `https://api.open-meteo.com/v1/forecast`
- Timezone: `Asia/Tokyo`
