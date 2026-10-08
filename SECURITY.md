# Security

## Identity & anti-fraud
- Identity = **verified phone number**. IP is never identity (a whole venue shares one).
- One vote per (visitor, category) enforced by a **database unique constraint** inside a transaction — concurrent requests cannot create duplicates (tested with 25 parallel submissions).
- Every vote re-checks on the server: session, voting open, on-site rule, category + exhibitor active, exhibitor assigned to category.
- On-site rule = venue IP allow-list (CIDR) and/or GPS geofence, both configurable. GPS alone is spoofable — use the IP list for real enforcement.

## OTP
6 digits from `crypto.randomInt`, stored as HMAC, 5-minute expiry (`OTP_TTL_MS`), max 5 attempts per code, 15 verify attempts / 10 min per visitor, 3 sends / 10 min per phone, 30 s resend countdown. Codes are never logged except by the **dev console mock**, which is disabled when `NODE_ENV=production`.

## Admin
scrypt password hashing, signed `HttpOnly; SameSite=Strict; Secure` (in production) cookie, 8 h expiry, login limited to 8 tries / 15 min per IP, every mutation written to `admin_audit_logs`. State-changing requests with a foreign `Origin` are rejected (CSRF). Phones are masked in the admin UI. MFA is a documented TODO in the login handler.

## Roles (RBAC)
Two roles — `super_admin`, `admin` — stored on `admins.role` (the former `viewer` role was removed; results are public on `/analysis`, which carries only names, team names, photo links and counts as allowed by the results mode — never visitor data). Every `/api/admin/*` route is mapped to a required permission in `ROUTE`; the admin row (and so the role) is re-read from the database on each request. Unauthenticated → `401`, insufficient role → `403` with a plain-language message, wrong method on a write route → `405`. Read endpoints also trim their payload by role (Admin gets no settings or users; phones are masked). User management refuses to remove or demote the last Super Admin or your own account.

## Web hardening
Strict CSP (`default-src 'self'`, no inline scripts), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`. All dynamic text is HTML-escaped in the client; all SQL uses bound parameters. CSV export neutralizes formula injection (`= + - @`).

## Uploads
Admin only, 2 MB max, type checked by **magic bytes** (JPG/PNG/WEBP — not by file name), stored under a random name, served with a fixed content type from a separate directory (never executed).

## Secrets & privacy
`SESSION_SECRET`, `ADMIN_PASSWORD`, `SMS_TOKEN` come from environment variables; production refuses to start without the first two. OTPs, passwords and tokens are never logged. The live-results stream carries counts only.

## Not covered (see README limitations)
MFA, field-level encryption of phone numbers, multi-instance rate limiting, WAF/DDoS protection (use your proxy/CDN).
