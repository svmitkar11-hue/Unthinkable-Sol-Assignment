# 🏢 Society Maintenance Tracker

A full-stack platform for apartment societies to manage maintenance complaints end to end.
Residents raise complaints with photos and track status history; admins triage them through a
priority + status workflow, flag overdue issues, run a notice board, and see a live dashboard.
Residents get email updates on status changes and important notices.

- **Backend:** Java 17 · Spring Boot 3 · Spring Security (JWT) · Spring Data JPA
- **Frontend:** React 18 · Vite · Tailwind CSS · React Router
- **Database:** PostgreSQL (H2 in-memory profile for zero-setup local runs)
- **Photos:** Cloudinary · **Email:** Gmail SMTP (JavaMailSender)

---

## Features

| Role | Capabilities |
|------|--------------|
| **Resident** | Register with **OTP email verification** · log in · raise a complaint (category, description, optional photo) · view own complaints with **full status history** · read the notice board |
| **Admin** | View all complaints · filter by category / status / date · set priority (Low/Medium/High) · move status through **Open → In Progress → Resolved** (each change logged with actor, note, timestamp) · resolved complaints auto-close · **overdue** items flagged & pinned on top · post notices (mark important = pinned + emailed) · dashboard (totals by status, category, priority, overdue count) · configure overdue threshold |

---

## Quick start

### Option A — Docker (everything in one command)

```bash
cp .env.example .env        # edit secrets (optional for a local demo)
docker compose up --build
```

- Frontend → http://localhost:5173
- Backend  → http://localhost:8080
- Postgres → localhost:5432

### Option B — Run locally without Docker

**1. Backend** (needs JDK 17 — Maven not required, the bundled wrapper `./mvnw` downloads it).
Zero-setup using the in-memory H2 profile:

```bash
cd backend
# Windows PowerShell
$env:SPRING_PROFILES_ACTIVE="h2"; $env:SEED_DEMO="true"; ./mvnw spring-boot:run
# macOS/Linux
SPRING_PROFILES_ACTIVE=h2 SEED_DEMO=true ./mvnw spring-boot:run
```

Or against a real Postgres — create a `society` database, then:

```bash
cd backend
export DB_URL=jdbc:postgresql://localhost:5432/society DB_USERNAME=society DB_PASSWORD=society
./mvnw spring-boot:run
```

**2. Frontend** (needs Node 20+):

```bash
cd frontend
cp .env.example .env         # VITE_API_URL=http://localhost:8080/api
npm install
npm run dev                  # http://localhost:5173
```

### Default credentials (seeded on first boot)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@society.com` | `admin123` |
| Resident (demo, `SEED_DEMO=true`) | `resident@demo.com` | `password123` |

> Change `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` for anything real.

---

## Configuration

All configuration is environment-driven — see [`.env.example`](./.env.example) for the full list.
Key ones:

| Variable | Purpose | Default |
|----------|---------|---------|
| `JWT_SECRET` | HMAC signing key (≥32 bytes) | dev placeholder |
| `OVERDUE_THRESHOLD_DAYS` | Days before an open complaint is overdue (also editable in Admin → Settings) | `7` |
| `MAIL_ENABLED` | Turn Gmail SMTP on | `false` |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Gmail address + [App Password](https://myaccount.google.com/apppasswords) | — |
| `CLOUDINARY_*` | Photo upload credentials (optional — falls back to local `uploads/`) | — |
| `STORAGE_LOCAL_DIR` | Local photo folder when Cloudinary is unset | `uploads` |
| `SEED_DEMO` | Seed a demo resident + sample data | `false` (true in H2/compose) |

**Photo uploads work out of the box:** with no Cloudinary keys, images are saved to a local
`uploads/` folder and served from `/uploads/**`. Set the `CLOUDINARY_*` keys to switch to
Cloudinary (CDN-hosted, survives ephemeral hosts) automatically. **Email** degrades gracefully too:
with `MAIL_ENABLED=false` messages (including signup OTPs) are logged to the terminal instead of sent.

---

## API documentation

Base URL: `http://localhost:8080/api`. All routes except `/auth/**` and `/health` require
`Authorization: Bearer <token>`.

### Auth

| Method | Path | Role | Body | Notes |
|--------|------|------|------|-------|
| POST | `/auth/register` | public | `{name, email, password, flatNumber}` | Creates an **unverified resident**, generates an OTP. Returns `{email, requiresVerification, message}` — **no token yet** |
| POST | `/auth/verify-otp` | public | `{email, otp}` | Verifies the code, marks the account active, returns `{token, user}` |
| POST | `/auth/resend-otp` | public | `{email}` | Issues a fresh OTP |
| POST | `/auth/login` | public | `{email, password}` | Returns `{token, user}`. Unverified accounts get `403` |
| GET | `/auth/me` | any | — | Current user |

> **OTP delivery:** no SMTP is required for the demo. On register/resend the 6-digit code is
> **printed to the backend terminal** (a boxed banner) and, if `MAIL_ENABLED=true`, also emailed.
> Seeded admin/demo accounts are pre-verified.

### Complaints

| Method | Path | Role | Body / Params | Notes |
|--------|------|------|---------------|-------|
| POST | `/complaints` | resident | `multipart`: `category`, `description`, `photo?` | Raise complaint |
| GET | `/complaints/mine` | resident | — | Own complaints + history |
| GET | `/complaints/{id}` | owner or admin | — | Single complaint + history |
| GET | `/complaints` | admin | `?category&status&from&to` | Filtered list, **overdue first, then priority, then oldest** |
| PATCH | `/complaints/{id}/status` | admin | `{status, note?}` | Logs history; `RESOLVED` closes it; closed = locked |
| PATCH | `/complaints/{id}/priority` | admin | `{priority}` | LOW / MEDIUM / HIGH |

`category` ∈ PLUMBING, ELECTRICAL, CLEANLINESS, SECURITY, ELEVATOR, PARKING, CARPENTRY, PEST_CONTROL, OTHER
`status` ∈ OPEN, IN_PROGRESS, RESOLVED · `priority` ∈ LOW, MEDIUM, HIGH · dates are `YYYY-MM-DD`.

### Notices

| Method | Path | Role | Body |
|--------|------|------|------|
| GET | `/notices` | any | — (important pinned first, then newest) |
| POST | `/notices` | admin | `{title, body, important}` — important ⇒ emails all residents |
| DELETE | `/notices/{id}` | admin | — |

### Admin dashboard & settings

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/admin/dashboard` | — | `{totalComplaints, overdueCount, byStatus, byCategory, byPriority}` |
| GET | `/admin/settings` | — | `{overdueThresholdDays}` |
| PUT | `/admin/settings` | `{overdueThresholdDays}` | Updates threshold + recomputes overdue |
| POST | `/admin/overdue/recompute` | — | `{overdueCount}` |

### Example

```bash
# Login as admin
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@society.com","password":"admin123"}'

# Raise a complaint (resident token)
curl -X POST http://localhost:8080/api/complaints \
  -H "Authorization: Bearer $TOKEN" \
  -F category=PLUMBING -F description="Leaking tap" -F photo=@leak.jpg
```

---

## Database schema

```
users
  id            BIGSERIAL PK
  name          VARCHAR       NOT NULL
  email         VARCHAR       NOT NULL UNIQUE
  password_hash VARCHAR       NOT NULL        -- BCrypt
  flat_number   VARCHAR
  role          VARCHAR       NOT NULL        -- RESIDENT | ADMIN
  created_at    TIMESTAMP     NOT NULL

complaints
  id            BIGSERIAL PK
  resident_id   BIGINT  FK -> users(id)  NOT NULL
  category      VARCHAR       NOT NULL        -- enum
  description   VARCHAR(4000) NOT NULL
  photo_url     VARCHAR                       -- Cloudinary secure URL
  status        VARCHAR       NOT NULL        -- OPEN | IN_PROGRESS | RESOLVED
  priority      VARCHAR       NOT NULL        -- LOW | MEDIUM | HIGH
  closed        BOOLEAN       NOT NULL        -- true once resolved
  overdue       BOOLEAN       NOT NULL        -- set by scheduler
  created_at    TIMESTAMP     NOT NULL
  updated_at    TIMESTAMP     NOT NULL
  resolved_at   TIMESTAMP

complaint_history                             -- one row per status change (immutable log)
  id            BIGSERIAL PK
  complaint_id  BIGINT  FK -> complaints(id)  NOT NULL
  old_status    VARCHAR                       -- null on creation
  new_status    VARCHAR       NOT NULL
  actor_id      BIGINT  FK -> users(id)
  note          VARCHAR(2000)
  timestamp     TIMESTAMP     NOT NULL

notices
  id            BIGSERIAL PK
  title         VARCHAR       NOT NULL
  body          VARCHAR(8000) NOT NULL
  important     BOOLEAN       NOT NULL        -- pinned + emailed
  author_id     BIGINT  FK -> users(id)
  created_at    TIMESTAMP     NOT NULL

app_settings                                  -- runtime config (key/value)
  setting_key   VARCHAR PK                    -- e.g. overdue_threshold_days
  setting_value VARCHAR       NOT NULL
```

Relationships: `users 1—N complaints`, `complaints 1—N complaint_history`, `users 1—N notices`.
Schema is created automatically by Hibernate (`ddl-auto=update`).

---

## Project structure

```
.
├── backend/           Spring Boot API
│   └── src/main/java/com/society/tracker/
│       ├── config/        security, CORS, data seeding
│       ├── controller/    REST endpoints
│       ├── dto/           request/response records
│       ├── model/         JPA entities + enums
│       ├── repository/    Spring Data repositories
│       ├── security/      JWT filter/service, UserDetails
│       └── service/       business logic, email, Cloudinary, overdue scheduler
├── frontend/          React + Vite SPA
│   └── src/{pages,components,context,api,lib}
├── docs/system-design.md
├── docker-compose.yml
└── .env.example
```

See [`docs/system-design.md`](./docs/system-design.md) for the design write-up.
