# Database (SQLite)

```
admins(id, username UNIQUE, password_hash, mfa_enabled, role)   -- role: super_admin | admin (default super_admin; added by auto-migration; former viewer rows are deleted)
settings(k PK, v)                       -- event, voting, geo_on, lat, lng, radius, ip_on, ips, results, opened_at, closed_at
categories(id, name, description, display_order, active)   -- display_order is deprecated/unused (kept so old databases still open); lists are ordered by id and shuffled per voter
exhibitors(id, project_name, exhibitor_name, short_description, image_url, active)
exhibitor_categories(exhibitor_id → exhibitors, category_id → categories)  PK(both)
visitors(id, name, phone UNIQUE, verified_at, created_at)
otp_requests(id, visitor_id, otp_hash, expires_at, attempts, consumed_at)
votes(id, visitor_id → visitors, category_id → categories, exhibitor_id → exhibitors, created_at,
      UNIQUE(visitor_id, category_id))          ← duplicate-vote guarantee
admin_audit_logs(id, admin_id, action, meta, created_at)
```

```
visitors 1─* votes *─1 categories
                  *
                  1
             exhibitors *─* categories   (via exhibitor_categories)
visitors 1─* otp_requests        admins 1─* admin_audit_logs
```

- **Index:** `votes(category_id, exhibitor_id)` for the leaderboard; the unique constraint also indexes `(visitor_id, category_id)`.
- OTP codes are stored only as an HMAC (`otp_hash`), never in clear.
- Deleting an exhibitor/category that already has votes **deactivates** it instead, so vote history is never lost.
- Single-event design: one event per database. The `settings` table holds the event configuration.
- Retention: delete or anonymize `visitors`/`otp_requests` after the event (e.g. `DELETE FROM otp_requests;` and blank `name`/`phone`) — votes keep their counts.
