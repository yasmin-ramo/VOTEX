# MC2026 Digital Voting System

Live voting for the Maker Collective 2026 Community Awards. Visitors open the voting link, verify their phone by SMS, and vote once in each category. A TV screen shows live rankings; organizers run everything from `/admin`.

**Zero npm dependencies.** Needs only Node 22.13+ (uses the built-in `node:sqlite`). No build step.

## Look & feel (brand)

The UI follows The Maker Collective 2026 palette — Navy `#00007b` as the main colour, with Deep Purple `#7f32d9`, Warm Yellow `#f8d749`, Royal Blue `#4a68d8` and Turquoise `#74dccf` as accents (Red `#a52a3a` for destructive actions). All colours are CSS variables at the top of `public/style.css`.

- **Logo + footer:** the official logo files (cropped from the brand guideline images) are in `public/brand/` — `logo.png` / `logo-white.png` (mark only, for light / navy backgrounds), `logo-full.png` / `logo-full-white.png` (with the Crown Prince Foundation lock-up, used in the voter footer) and `favicon.png`. They are raster files taken from the guideline pages; to get the sharpest result on big screens, drop the original vector/high-res exports in with the same names. The voter footer (navy banner + purple contact strip: Tel / Email / Fax / P.O.Box) is built in `foot()` in `public/app.js`; contact details are in the `CONTACT` constant there, and the three round social icons appear once you paste the page links into `SOCIAL`.
- **Fonts:** `public/fonts.css` loads two families, `MC Sans` (English → Nexa) and `MC Arabic` (Arabic → HelveticaNeue LT Arabic). Open-licensed stand-ins (Outfit, IBM Plex Sans Arabic) are bundled so the app works out of the box. To use the official fonts, copy the licensed files into `public/fonts/` and follow the comment at the top of `public/fonts.css`.
- **Screens:** `/` visitor voting · `/results` TV leaderboard (responsive to any 16:9 screen, 1080p–4K) · `/admin` dashboard (Overview is a live command center — voting banner with open/close, six metric cards, live leaderboard per category, big-screen preview, latest votes, reset/export; it refreshes itself every 5 seconds — plus Results, Exhibitors with photo preview, Categories, Visitors, Team access, Settings — each tab shown only if your role allows it).
- Voting logic, cookies/sessions, upload and result calculations are unchanged (the QR feature and the manual display order were removed on purpose). Native `confirm()`/`prompt()` boxes were replaced by in-page dialogs that make the same API calls (resetting votes still requires typing `RESET`).

## Run it (demo mode)

```bash
node server.mjs            # http://localhost:3000
```

| URL | What |
|---|---|
| `/` | Visitor landing (event video, Arabic/English, **Vote** or **Results / Analysis**) |
| `/analysis` | Public Results / Analysis page — live, no login, follows the *Results screen* setting |
| `/results` | Live TV results screen (full-screen it on a 16:9 TV; also works as a laptop preview). States follow the real data: **waiting** (no votes yet — finalists only, no ranks), **Live voting** (leader spotlight, race bars, QR “Scan to vote”), **Final results** (winners revealed category by category, ties shown as joint winners). Add `?vote=https://your-public-link` to point the QR somewhere other than this server. |
| `/admin` | Organizer login (see roles below) |
| `/api/health` | Health check (JSON: status, db, uptime) — used by Docker and load balancers |

In demo mode the SMS code is **printed in the server console** (`[DEV OTP] +962…: 123456`). A demo event with 3 categories and 12 exhibitors is created automatically. Tests: `npm test`.

## 5-minute demo script

1. `/admin` → sign in → **Overview** is the live command center. Share the voting link (`/`) directly — no QR needed.
2. **Exhibitors** → add one (upload a photo) → assign categories → Save.
3. **Open Voting**. Put `/results` on the big screen.
4. On a phone: open the link → Start Voting → name + number → read the code from the console → vote in 3 categories.
5. Watch the TV rankings move instantly; Admin → **Results** shows counts and percentages.
6. **Close Voting** → try voting again (rejected) → **Export results (CSV)**.

## Roles & access (Admin → Team access)

| Capability | Super Admin | Admin |
|---|:-:|:-:|
| View dashboard, results, live screen | ✅ | ✅ |
| Add / edit / delete exhibitors (teams) and categories, upload photos | ✅ | ✅ |
| View visitors list, export results CSV | ✅ | ✅ |
| Open / close voting | ✅ | ❌ |
| Reset all votes | ✅ | ❌ |
| Settings (event name, results mode, geofence, IP rules) | ✅ | ❌ |
| Manage team access (create / change / remove admins) | ✅ | ❌ |

**Viewer Admin was removed.** Anyone who only needs to *see* results now uses the public **Results / Analysis** page (`/analysis`, also reachable from the landing card) — no account needed. It shows totals, voters, the leader and ranking per category, vote shares, the most active category and the closest race, updating live. It follows **Settings → Results screen**: *Hidden* reveals nothing, *Ranking only* hides all numbers, *Ranking + vote count* shows everything. It never shows visitor names or phone numbers. Existing Viewer Admin accounts are deleted automatically when the server starts.

Enforced on the server for every `/api/admin/*` route (role is re-read from the database on each request, so a role change or removal takes effect immediately): `401` = not signed in, `403` = signed in but role not allowed (message names the role and the action). The UI also hides what a role can't use. The matrix lives in one place (`PERM` in `server.mjs`) if you want to tighten it. The last Super Admin can't be demoted or deleted.

**Test accounts (development only — created when `NODE_ENV` is not `production`):**

| User | Password | Role |
|---|---|---|
| `admin` | `admin1234` | Super Admin |
| `manager` | `manager1234` | Admin |

In production only `ADMIN_USER` / `ADMIN_PASSWORD` is created (as Super Admin); add the others from **Team access**. Existing databases are migrated automatically — admins created before roles existed become Super Admin; Viewer Admin accounts are removed.

## Voter menu

- **Landing.** The first screen shows the event video in a navy band under a transparent header with the logo centred, then an English | العربية switch and two cards: **Vote** and **Results / Analysis**. The video (`public/media/mc2026.mp4`, with a `.webm` fallback and a poster frame) plays muted and looped, has a pause/play button, pauses when scrolled away and does not autoplay for visitors who ask for reduced motion. The "2026" title is not overlaid because it is already part of the video. To swap the video, replace those files with the same names (keep it muted-friendly: no important audio).
- **Language.** The language choice is remembered on that phone; a small switch in the header changes it later. All voter text, right-to-left layout, validation messages and dialogs follow the choice. Team and category names show exactly as typed by the admin. Strings live in the `TX` table at the top of the voter section of `public/app.js`.
- **Look:** light page, navy header/text, yellow main buttons, turquoise for selected states, purple/turquoise/yellow soft background that fades in once (and is switched off for `prefers-reduced-motion`).

- **Random order, no display order.** Teams are shuffled per voter session (seeded by a random per-login value + the category), so the order is unbiased across voters, doesn't change on refresh or when switching tabs during that session, and every team always appears. Admin lists are in a fixed order (by creation). A new login gets a new order.
- **Search** box above each category filters by team/project name (accent- and Arabic-tolerant) within the current category only, with a clear button and a friendly empty state.
- **Motion** is CSS-only (transform/opacity), only on the voter pages, and switched off for `prefers-reduced-motion`.

## Admin content rules

- **Exhibitors** need all of: project name, team/exhibitor name, short description, a photo (upload or an `https://` image link — an emoji no longer counts) and at least one category. Checked in the form (messages under each field) and again on the server (`400 {code:'invalid', field, error}`).
- **Categories** are fixed: the admin screen lists and edits the existing ones (name, description, enabled) but has no "Add category" form. The `/api/admin/category` route is unchanged.

## Configure (Admin → Settings)

Event name · results mode (Hidden / Ranking only / Ranking + counts) · geofence (lat/lng/radius) · venue IP ranges (CIDR). All stored in the database.

**Who can vote (venue check).** Three optional methods; when any are switched on, passing **any one** is enough:
- **Venue network** — the phone's IP is inside the venue ranges.
- **Location** — the phone's GPS is inside the radius (gives a 2-hour location pass).
- **Rotating venue QR** — the live screen (`/results`) shows a QR that changes every 15 seconds. Each code is `HMAC(secret, time-slot)` (nothing stored), accepted for about 15–30 seconds, then exchanged for a signed 1-hour venue pass (`QR_PASS_MS`, slot length `QR_SLOT_MS`). The code is only sent to a screen whose browser is **signed in to the dashboard** — a public copy of `/results` shows a plain link and a hint for organizers. A screenshot sent to someone elsewhere expires before it is useful; every voter still needs their own phone number and SMS code.

With no method switched on, anyone with the link can vote (still one phone number = one vote per category). Turning a method off immediately stops its passes from counting.

## Deploy

See [DEPLOYMENT.md](DEPLOYMENT.md). Short version: `cp .env.example .env`, edit, `docker compose up -d --build`, put HTTPS in front.

## Documentation

[ARCHITECTURE.md](ARCHITECTURE.md) · [DATABASE.md](DATABASE.md) · [SECURITY.md](SECURITY.md) · [DEPLOYMENT.md](DEPLOYMENT.md)

## Known prototype limitations (be honest on stage)

- **Single instance.** SQLite + in-memory rate limits + in-process SSE fan-out. Fine for ~1,000 users on one server; multiple instances need Postgres, Redis (rate limits, pub/sub) — see ARCHITECTURE.md.
- **Geofence is client-reported.** GPS coordinates can be spoofed. Use it together with the venue IP allow-list for real enforcement.
- **MFA not implemented** (hook marked `TODO MFA` in the admin login; `admins.mfa_enabled` column exists). Three admin roles (see above).
- **`/results` is public read-only** (no login) and shows only ranking data — no visitor info. Put it behind the venue network or basic auth at the proxy if needed.
- **No voting start/end schedule**; admins open/close manually (timestamps are in the audit log).
- Phone numbers are stored in plain text in SQLite (masked in the UI). Use disk encryption + restricted file permissions, or add field encryption before production.
- No "votes over time" chart; the dashboard shows totals, per-category counts and votes/minute.
- Images are resized in the admin's browser before upload; no server-side thumbnails.

## Production-readiness checklist

- [ ] HTTPS in front, `TRUST_PROXY=1`, real `SESSION_SECRET`, strong `ADMIN_PASSWORD`
- [ ] SMS provider connected via `SMS_WEBHOOK` and tested with a real number
- [ ] Venue public IP added to Allowed IP ranges and IP restriction switched on
- [ ] Load test on the real hardware (1,000 phones on one Wi-Fi)
- [ ] `/data` volume backed up (see DEPLOYMENT.md); restore tested
- [ ] Dry run: full flow with 10 real phones, then **Reset all votes** before the event
