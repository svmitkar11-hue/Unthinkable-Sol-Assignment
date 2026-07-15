# System Design — Society Maintenance Tracker

## Overview

A three-tier system: a React SPA, a stateless Spring Boot REST API secured with JWT, and a
PostgreSQL database. Two roles — `RESIDENT` and `ADMIN` — are encoded in the JWT and enforced
per-endpoint with method-level security. The four areas below are the ones that shaped the design.

## Complaint history model

The requirement is that *every* status change is recorded with a timestamp, the actor, and an
optional note — and that residents can replay the full life of a complaint. Rather than overwrite
state, I model history as an **append-only event log**.

`complaint_history` holds one immutable row per transition: `old_status`, `new_status`,
`actor_id`, `note`, `timestamp`. The `complaints` row keeps the *current* denormalised state
(status, priority, `resolved_at`, `closed`) for cheap listing and filtering, while the history
table is the authoritative audit trail. Creation itself is the first event (`old_status = null →
OPEN`, actor = resident, note "Complaint created"), so the timeline is complete from birth.

Writes go through a single service method: it validates the transition, mutates the complaint,
appends a history row in the *same* transaction, and only then triggers side effects. This keeps
state and log atomically consistent — you can never have a status the log doesn't explain.

**Lifecycle:** `OPEN → IN_PROGRESS → RESOLVED`. Reaching `RESOLVED` sets `resolved_at`, clears the
overdue flag, and sets `closed = true`. Any change to a closed complaint is rejected (`400`), which
enforces the "once resolved, it is closed" rule at the service layer rather than trusting the UI.

## Overdue detection

Overdue is derived from a **configurable threshold** (`overdue_threshold_days`, default 7) stored
in an `app_settings` key/value table so admins can change it at runtime without a redeploy.

Detection runs as a scheduled job (`@Scheduled`, hourly) plus on demand. It computes
`cutoff = now − thresholdDays` and, for every non-resolved complaint, sets `overdue = true` when
`created_at < cutoff`, else false. Persisting a boolean flag — instead of computing "overdue" on
every read — means the admin list and dashboard stay a simple indexed query, and the flag can drive
ordering directly. Changing the threshold in **Settings** immediately re-runs the job so the effect
is visible at once. Because overdue is a stored flag, admin listings sort **overdue-first, then by
priority (High→Low), then oldest-first**, surfacing the most urgent, most-neglected issues at the
top exactly as required.

## Photo handling

Complaint photos are uploaded as `multipart/form-data` alongside the text fields. The API validates
content type (`image/*`) and size (≤5 MB), then streams the bytes to **Cloudinary** and stores only
the returned `secure_url` on the complaint. Keeping binaries out of the database and off local disk
keeps the app **stateless and host-agnostic** — it survives ephemeral filesystems (Render/Railway
free tiers) and horizontal scaling, and the browser loads images straight from Cloudinary's CDN.
The frontend shows a client-side preview before submit. If Cloudinary isn't configured the service
fails fast with a clear message and the rest of the flow (text-only complaints) still works.

## Notification flow

Residents are notified by email on two events: **their complaint's status changing**, and **a new
important notice**.

Emails are sent through Gmail SMTP via `JavaMailSender`, dispatched **asynchronously** (`@Async`) so
mail latency never blocks the API response, and wrapped in try/catch so a mail failure can never
break a status update or notice post. When `MAIL_ENABLED=false`, messages are logged instead of
sent, which keeps local development and demos friction-free.

- **Status change:** after the history row commits, the service fires a status-change email to the
  complaint's owner including the transition and the admin's note.
- **Important notice:** the notice board stores every notice, but only those flagged `important`
  are pinned to the top *and* broadcast to all residents. This deliberately limits email volume to
  genuinely urgent announcements.

Because notifications are a side effect *after* the transactional write, the system's source of
truth (DB state + history log) is never dependent on the email actually being delivered.

## Cross-cutting choices

- **Auth:** BCrypt password hashing; short-lived JWTs carrying the role claim; a stateless
  `OncePerRequestFilter` validates the token and populates the security context. Public
  registration is resident-only; the admin is seeded from configuration.
- **Filtering:** admin complaint search uses JPA `Specification`s to compose optional
  category/status/date predicates into one query.
- **Schema management:** Hibernate `ddl-auto=update` for straightforward setup; an H2 profile gives
  a zero-dependency local run, while Postgres is the default for Docker and production.
- **Dashboard:** a single aggregation pass yields totals by status, category, and priority plus the
  overdue count, rendered as stat cards and proportional bars.

The result is a system where complaint state is always explainable by its log, urgency is both
configurable and visible, media scales independently of the app, and notifications inform residents
without ever compromising data integrity.
