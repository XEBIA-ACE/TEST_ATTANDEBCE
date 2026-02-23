# Attendance Tracking Service

A production-ready REST API for tracking employee attendance — clock-in/out events, breaks, overtime calculation, and reporting.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| ORM | Sequelize 6 |
| Database | PostgreSQL 16 |
| Validation | Joi |
| Auth | JWT (jsonwebtoken) |
| Logging | Winston + daily-rotate-file |
| Docs | Swagger / OpenAPI 3.0 |
| Testing | Jest + Supertest |
| Container | Docker / Docker Compose |

---

## Project Structure

```
attendance-tracking-service/
├── src/
│   ├── api/
│   │   ├── controllers/        # HTTP layer — parse request, call service, format response
│   │   ├── middlewares/        # Auth, validation, error handling, request logging
│   │   ├── routes/             # Express routers
│   │   └── validators/         # Joi schemas
│   ├── config/                 # App, DB, and logger configuration
│   ├── database/
│   │   ├── connection.js       # Sequelize instance
│   │   ├── migrate.js          # Umzug migration runner
│   │   ├── seed.js             # Development seed data
│   │   └── migrations/         # Ordered migration files
│   ├── docs/
│   │   └── swagger.js          # OpenAPI spec generator
│   ├── models/                 # Sequelize model definitions
│   ├── repositories/           # Data-access layer (all DB queries live here)
│   ├── services/               # Business logic layer
│   ├── utils/
│   │   ├── errors.js           # Custom error classes
│   │   └── response.js         # Standardised response helpers
│   ├── app.js                  # Express app setup
│   └── server.js               # Entry point / graceful shutdown
├── tests/
│   ├── unit/                   # Pure unit tests (repositories mocked)
│   └── integration/            # HTTP-level tests (service mocked)
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ **or** Docker + Docker Compose

### Option A — Docker Compose (recommended)

```bash
# Clone and enter the directory
git clone <repo-url>
cd attendance-tracking-service

# Start the API + database
docker compose up --build

# In a second terminal, run migrations
docker compose exec app npm run migrate

# (optional) Seed sample data
docker compose exec app npm run seed
```

The API is available at `http://localhost:3000`.
Swagger UI: `http://localhost:3000/api-docs`

---

### Option B — Local Node.js

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Postgres credentials

# 3. Run migrations
npm run migrate

# 4. (optional) Seed
npm run seed

# 5. Start the dev server (auto-reload via nodemon)
npm run dev
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `PORT` | `3000` | HTTP port |
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_NAME` | `attendance_db` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `JWT_SECRET` | — | **Required in production** |
| `JWT_EXPIRES_IN` | `24h` | Access token TTL |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Requests per window |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |

See `.env.example` for the full list.

---

## API Reference

### Base URL

```
/api/v1
```

All endpoints return a consistent JSON envelope:

**Success**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
}
```

**Error**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Employee not found",
    "details": []
  }
}
```

---

### Employees

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/employees` | List employees (paginated) |
| `GET` | `/api/v1/employees/:id` | Get employee by ID |
| `POST` | `/api/v1/employees` | Create employee |
| `PATCH` | `/api/v1/employees/:id` | Update employee |
| `DELETE` | `/api/v1/employees/:id` | Soft-delete employee |

**List query params**: `page`, `limit`, `search`, `departmentId`, `isActive`, `employmentType`

**Create body**:
```json
{
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice@example.com",
  "hireDate": "2024-01-15",
  "departmentId": "uuid",
  "position": "Engineer",
  "employmentType": "full_time",
  "scheduledHoursPerDay": 8,
  "workDays": [1,2,3,4,5],
  "timezone": "America/New_York"
}
```

---

### Attendance

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/attendance` | List records (paginated) |
| `GET` | `/api/v1/attendance/summary` | Aggregate stats |
| `GET` | `/api/v1/attendance/:id` | Get record by ID |
| `POST` | `/api/v1/attendance/clock-in` | Clock in |
| `POST` | `/api/v1/attendance/clock-out` | Clock out |
| `POST` | `/api/v1/attendance/break/start` | Start break |
| `POST` | `/api/v1/attendance/break/end` | End break |
| `POST` | `/api/v1/attendance/manual` | Create manual record (admin) |
| `PATCH` | `/api/v1/attendance/:id` | Update record |
| `DELETE` | `/api/v1/attendance/:id` | Soft-delete record |

**Clock-in body**:
```json
{
  "employeeId": "uuid",
  "date": "2024-06-10",
  "location": { "lat": 40.7128, "lng": -74.006, "address": "NYC" },
  "notes": "On-site"
}
```

**Clock-out body**:
```json
{
  "employeeId": "uuid",
  "location": { "lat": 40.7128, "lng": -74.006 }
}
```

**Summary query params**: `employeeId`, `startDate`, `endDate`

---

### System

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (DB ping, memory) |
| `GET` | `/metrics` | Basic process metrics |
| `GET` | `/api-docs` | Swagger UI (non-production only) |

---

## Authentication

All `/api/v1/*` endpoints accept a Bearer JWT:

```
Authorization: Bearer <token>
```

The `auth.middleware.js` verifies the signature and expiry. The `authorize(...roles)` factory can restrict endpoints to specific roles (`admin`, `manager`, etc.).

> **Placeholder**: Token issuance (login endpoint) is outside the scope of this service — integrate with your identity provider or add a `/auth/login` route.

---

## Database Schema

### `departments`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `name` | VARCHAR(100) | Unique |
| `manager_id` | UUID FK → employees | Nullable |
| `is_active` | BOOLEAN | |

### `employees`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `employee_number` | VARCHAR(20) | Unique, auto-generated |
| `first_name`, `last_name` | VARCHAR(100) | |
| `email` | VARCHAR(255) | Unique |
| `department_id` | UUID FK | Nullable |
| `employment_type` | ENUM | full_time / part_time / contractor / intern |
| `hire_date` | DATE | |
| `scheduled_hours_per_day` | DECIMAL | Default 8.0 |
| `work_days` | INTEGER[] | ISO weekday numbers |
| `timezone` | VARCHAR(50) | |

### `attendance_records`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `employee_id` | UUID FK | |
| `date` | DATE | Unique per employee (non-deleted) |
| `clock_in`, `clock_out` | TIMESTAMPTZ | |
| `total_hours` | DECIMAL | Auto-calculated on clock-out |
| `overtime_hours` | DECIMAL | hours beyond `scheduled_hours_per_day` |
| `status` | ENUM | present / absent / late / half_day / on_leave / holiday / remote |
| `break_duration_minutes` | INTEGER | |
| `clock_in_location`, `clock_out_location` | JSONB | `{ lat, lng, address }` |
| `is_manual_entry` | BOOLEAN | |
| `approved_by` | UUID FK → employees | |

All tables support soft-delete (`deleted_at`) and have `created_at`/`updated_at` timestamps.

---

## Testing

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Coverage report
npm run test:coverage
```

Tests do **not** require a live database — the repository layer is mocked in unit tests and the service layer is mocked in integration tests.

---

## Running Migrations

```bash
# Apply pending migrations
npm run migrate

# Revert the latest migration
npm run migrate:undo
```

---

## Architecture Overview

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────┐
│  Express App (app.js)                   │
│  ┌──────────────────────────────────┐   │
│  │  Middleware Chain                │   │
│  │  helmet → cors → rateLimit →     │   │
│  │  requestLogger → routes          │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  Routes  (validate → controller) │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Service Layer (business rules)         │
│  - Input sanitisation & rule checks     │
│  - Orchestrates repository calls        │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Repository Layer (data access)         │
│  - All Sequelize/SQL queries here       │
│  - Returns model instances              │
└─────────────────────────────────────────┘
     │
     ▼
  PostgreSQL
```

**Key design decisions**:
- **Soft deletes** on all entities (`paranoid: true`) preserve audit history
- **UTC storage** — all timestamps stored in UTC; employee `timezone` field used for local-date calculations on the client
- **Hooks** — `beforeSave` on `AttendanceRecord` auto-computes `totalHours` / `overtimeHours`
- **Single active session** — the service layer enforces one open clock-in per employee at a time
- **Role-based auth** — the `authorize(...roles)` middleware factory makes it easy to protect any route

---

## Production Checklist

- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET` values
- [ ] Enable SSL for the database (`dialectOptions.ssl`)
- [ ] Set `NODE_ENV=production` to disable Swagger UI
- [ ] Configure proper `CORS_ORIGINS`
- [ ] Mount a volume for the `logs/` directory
- [ ] Set up log shipping (e.g. CloudWatch, Datadog)
- [ ] Add a proper auth/login endpoint or integrate with an IdP
- [ ] Review and tune `DB_POOL_MAX` for your workload
