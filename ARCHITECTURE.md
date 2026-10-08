# Architecture

```
 phone ─┐                    ┌── static SPA (public/: index.html, app.js, style.css)
 TV  ───┼── HTTPS ── Node ───┼── JSON API  /api/*
 admin ─┘  (proxy)  server.mjs├── SSE        /api/stream  (live results)
                              └── SQLite file (WAL) + uploads dir   → /data volume
```

One Node process, no framework, no dependencies. The browser app is a small single-page app with three modes chosen by URL: visitor (`/`), TV (`/results`), admin (`/admin`).

## Layers (all in `server.mjs`, in this order)

| Section | Responsibility |
|---|---|
| schema + seed | tables, constraints, demo data (never in production unless `SEED_DEMO=1`) |
| helpers | settings, signed cookies (HMAC), scrypt passwords, rate limiter, IP/CIDR + haversine, phone normalization |
| OTP provider | `SMS_WEBHOOK` adapter (any vendor behind a webhook) or console mock in dev. Replace `sms()` to add a vendor SDK |
| results + realtime | cached aggregation, SSE broadcast |
| http routes | public, visitor, admin |

## Visitor flow

`/` → `POST /api/locate` (checks IP rule and/or GPS; sets a signed 2h `loc` cookie) → `POST /api/register` (normalizes phone, creates visitor, sends OTP) → `POST /api/verify` (sets signed 24h `sid` cookie) → `GET /api/ballot` → `POST /api/vote` per category.

Sessions are **stateless signed cookies**, so any instance can serve any request and a server restart logs nobody out.

## Roles and ballot order

`/api/admin/*` passes through one gate: session → admin row → `ROUTE[path]` permission → `PERM[permission]` includes role. `/api/ballot` returns each category's exhibitors shuffled with a seeded Fisher–Yates (`shuffle(list, salt+':'+categoryId)`); the salt is random per login and stored in the signed `sid` cookie, so the order is stable for a session without any server state.

## Vote processing (`POST /api/vote`)

1. Valid visitor session (verified phone)
2. Voting is `open` (read from DB every request)
3. On-site check: venue IP rule and/or valid `loc` cookie
4. `BEGIN IMMEDIATE` transaction
5. Category active, exhibitor active **and assigned to that category**
6. Existing vote for (visitor, category)? same exhibitor → success (idempotent retry); different → `409 already`
7. `INSERT` — `UNIQUE(visitor_id, category_id)` is the final guarantee
8. `COMMIT`, then schedule an SSE push

The client treats a dropped connection as "unknown": it polls `/api/ballot` to see whether the vote landed before re-sending, so a flaky Wi-Fi never produces a duplicate or a false "failed".

## Realtime

The TV and the public Results / Analysis page each open one SSE connection. Votes/admin edits call `push()`, which debounces (300 ms), re-aggregates once, and writes the same payload to every open connection — cost is **one DB aggregation per push, not per viewer**. Aggregations are also cached 700 ms. Payload contains only category/exhibitor names and counts (no visitor data). The browser reconnects automatically if the stream drops.

## Scaling beyond one server

| Concern | Now | Multi-instance |
|---|---|---|
| Database | SQLite (WAL, `busy_timeout`) — thousands of writes/s is plenty for 1,000 voters | PostgreSQL; the schema ports directly; keep the unique constraint |
| Rate limits | in-memory per process | Redis counters |
| SSE fan-out | in-process | Redis/Postgres `LISTEN/NOTIFY` → each instance pushes to its own clients |
| Sessions | signed cookies | no change needed |

## Network note

Phones on venue Wi-Fi usually share **one public IP**, so IP is never used as identity and per-IP limits are high by default (`RL_IP_PER_MIN`, `RL_REGISTER_PER_IP`). Per-phone and per-visitor limits do the real throttling.

## Health check

`GET /api/health` returns `200 {"status":"ok","db":"up","uptime_s":…}` after running `SELECT 1` against SQLite, or `503 {"status":"degraded","db":"down"}`. It carries no visitor data. `GET /healthz` is kept as a minimal alias.
