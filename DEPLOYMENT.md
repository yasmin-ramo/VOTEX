# Deployment

## Docker (recommended)
```bash
cp .env.example .env      # set SESSION_SECRET, ADMIN_PASSWORD, SMS_WEBHOOK/SMS_TOKEN, TRUST_PROXY=1
docker compose up -d --build
curl localhost:3000/api/health   # -> {"status":"ok","db":"up",...}  (/healthz also works)
```
Data (SQLite + uploads) lives in the `mc2026-data` volume at `/data`.

## Without Docker
```bash
NODE_ENV=production SESSION_SECRET=… ADMIN_PASSWORD=… SEED_DEMO=1 node server.mjs
```

## HTTPS
Run behind Caddy, nginx or a cloud load balancer. Caddy example: `vote.example.com { reverse_proxy localhost:3000 }`. **Disable proxy response buffering for `/api/stream`** (nginx: `proxy_buffering off;`) so live results are not delayed. Keep `TRUST_PROXY=1` so the venue IP check sees the real client IP.

## Local event server
Run on a laptop on the venue network; share `http://<laptop-ip>:3000/` as the voting link (print it on a poster or send it by message). Geolocation requires HTTPS on phones, so for a LAN server use the **IP allow-list** (venue subnet) and leave geofencing off.

## SMS provider
`SMS_WEBHOOK` receives `POST {"to":"+9627…","text":"Your Maker Collective code: 123456"}` with `Authorization: Bearer $SMS_TOKEN`; any non-2xx is treated as failure. To use a vendor SDK directly, replace the `sms()` function in `server.mjs`.

## Environment variables
See `.env.example`. Also: `PORT` (3000), `DB_FILE`, `UPLOAD_DIR`, `ADMIN_USER`.

## Backup / recovery
Stop-free backup while running: `sqlite3 /data/mc2026.db ".backup /data/backup.db"` (or copy `mc2026.db*` with the container stopped) plus the `/data/uploads` folder. Snapshot every 5–10 minutes during the event. Restore = put files back in the volume and restart.

## Before the event
Full dry run with real phones, load test, add the venue public IP to Allowed IP ranges, **Reset all votes**, then open voting.
