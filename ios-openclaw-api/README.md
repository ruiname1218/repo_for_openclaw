# iOS → OpenClaw API (Raspberry Pi)

Minimal API server that lets an iOS app call OpenClaw via HTTP.

## Setup

```bash
cd ios-openclaw-api
cp .env.example .env
# edit .env and set APP_TOKEN
export $(grep -v '^#' .env | xargs)
npm start
```

Server starts on `http://localhost:3000` by default.

## Endpoints

### GET /health

Returns `{ "ok": true }`

### POST /chat

Headers:

- `Authorization: Bearer <APP_TOKEN>`
- `Content-Type: application/json`

Body:

```json
{ "message": "こんにちは" }
```

Success:

```json
{ "reply": "..." }
```

## Quick test

```bash
curl -s http://127.0.0.1:3000/health

curl -s http://127.0.0.1:3000/chat \
  -H "Authorization: Bearer $APP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"こんにちは"}'
```

## Notes

- Keep this API behind Tailscale / VPN or HTTPS reverse proxy.
- Do not hardcode APP_TOKEN in the iOS app for production.
