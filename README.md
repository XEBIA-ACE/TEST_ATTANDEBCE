# Attendance Tracking Service

A production-ready RESTful API for tracking employee attendance, built with **Node.js** and **Express**.

## Features

- **Check-in / Check-out** recording with automatic status derivation (present, late, half-day)
- **Employee management** — CRUD with soft-delete and pagination
- **Attendance reports** — aggregated statistics per employee / department / date range
- **Clean Architecture** — API → Service → Repository separation
- **JWT authentication** placeholder with role-based authorisation
- **OpenAPI 3.0 / Swagger UI** at `/api-docs` (dev only)
- **Structured logging** via Winston with daily log rotation
- **Rate limiting**, Helmet security headers, CORS, compression
- **Graceful shutdown** with in-flight request draining
- **Docker** multi-stage build + `docker-compose` for local development
- **Unit & integration tests** with Jest and Supertest

---

## Architecture

```
src/
├── api/
│   ├── controllers/      # HTTP layer — parse request, call service, format response
│   ├── middlewares/       # auth, errorHandler, requestLogger, validate
│   ├── routes/            # Express Router definitions + JSDoc/Swagger annotations
│   └── validators/        # Joi schemas for request validation
├── config/
│   ├── index.js           # Centralised config from env vars
│   ├── database.js        # Singleton Knex instance
│   └── swagger.js         # OpenAPI spec definition
├── db/
│   ├── knexfile.js        # Knex environment configs
│   ├── migrations/        # Schema versioned migrations
│   └── seeds/             # Development seed data
├── repositories/          # Data-access layer (SQL queries only)
├── services/              # Business logic layer
├── utils/
│   ├── errors.js          # Custom typed error classes
│   ├── logger.js          # Winston logger
│   └── response.js        # Helpers for standardised JSON responses
├── app.js                 # Express application setup
└── server.js              # Entry point — DB check, listen, graceful shutdown
tests/
├── unit/services/         # Jest mocked unit tests
└── integration/           # Supertest end-to-end tests (needs live DB)
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| PostgreSQL | ≥ 14 |
| Docker & Docker Compose | (optional) |

---

## Quick Start

### Option A — Docker Compose (recommended)

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd attendance-tracking-service

# 2. Copy environment config
cp .env.example .env

# 3. Start PostgreSQL and the API
docker compose up -d

# 4. Run database migrations
docker compose --profile migrate run --rm migrate

# 5. (Optional) Load seed data
docker compose --profile seed run --rm seed

# API is now available at http://localhost:3000
# Swagger UI:          http://localhost:3000/api-docs
```

### Option B — Local development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env to point to your PostgreSQL instance

# 3. Run migrations
npm run migrate

# 4. (Optional) Seed data
npm run seed

# 5. Start dev server (hot-reload with nodemon)
npm run dev
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development` / `test` / `production` |
| `PORT` | `3000` | HTTP server port |
| `API_VERSION` | `v1` | URL prefix for all API routes |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `attendance_db` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `JWT_SECRET` | — | **Required in prod** — JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | JWT access token TTL |
| `LOG_LEVEL` | `debug` | `error` / `warn` / `info` / `debug` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (ms) |
| `CORS_ORIGIN` | `*` | Allowed CORS origin(s) |

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

### Employees

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/employees` | List employees (paginated, filterable) |
| `GET` | `/employees/:id` | Get employee by UUID |
| `POST` | `/employees` | Create employee |
| `PUT` | `/employees/:id` | Update employee |
| `DELETE` | `/employees/:id` | Deactivate employee (`?force=true` for hard delete) |

**Create Employee — Request body:**
```json
{
  "employee_code": "EMP-001",
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@example.com",
  "phone": "+1-555-0101",
  "department": "Engineering",
  "position": "Senior Developer",
  "status": "active",
  "hire_date": "2024-01-15"
}
```

**List Employees — Query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (max: 100, default: 20) |
| `department` | string | Filter by department |
| `status` | string | `active` / `inactive` / `on_leave` |
| `search` | string | Search name, email, or code |

---

### Attendance

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/attendance` | List records (paginated, filterable) |
| `GET` | `/attendance/report` | Aggregated report |
| `GET` | `/attendance/:id` | Get record by UUID |
| `POST` | `/attendance/check-in` | Record employee check-in |
| `POST` | `/attendance/check-out` | Record employee check-out |
| `PUT` | `/attendance/employees/:employeeId/:date` | Admin upsert |
| `DELETE` | `/attendance/:id` | Delete a record |

**Check-in — Request body:**
```json
{
  "employee_id": "uuid-of-employee",
  "check_in_time": "2024-01-15T08:00:00Z",
  "notes": "Optional note"
}
```

**Check-out — Request body:**
```json
{
  "employee_id": "uuid-of-employee",
  "check_out_time": "2024-01-15T17:00:00Z"
}
```

**Attendance status rules:**
- No check-in → `absent`
- Check-in after 09:15 UTC → `late`
- Work hours < 4 → `half_day`
- Otherwise → `present`

**List Attendance — Query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `employee_id` | uuid | Filter by employee |
| `start_date` | date | From date (YYYY-MM-DD) |
| `end_date` | date | To date (YYYY-MM-DD) |
| `status` | string | `present` / `absent` / `late` / `half_day` / `on_leave` |

**Report — Query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `employee_id` | uuid | Single employee report |
| `start_date` | date | From date |
| `end_date` | date | To date |
| `department` | string | Filter by department |

---

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness probe |
| `GET` | `/health/ready` | Readiness probe (DB check) |
| `GET` | `/health/metrics` | Runtime metrics (uptime, memory, CPU) |

---

### Standardised Response Format

**Success:**
```json
{
  "success": true,
  "message": "Employees retrieved successfully",
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "email", "message": "email must be a valid email" }]
  }
}
```

---

## Running Tests

```bash
# Unit tests (no DB needed)
npm run test:unit

# Integration tests (requires live test DB)
NODE_ENV=test DB_NAME=attendance_db_test npm run migrate
npm run test:integration

# All tests with coverage
npm run test:coverage
```

---

## Database Migrations

```bash
# Apply all pending migrations
npm run migrate

# Roll back the last batch
npm run migrate:rollback

# Create a new migration file
npm run migrate:make -- your_migration_name
```

---

## Production Deployment

1. Set `NODE_ENV=production` and all required env vars (especially `JWT_SECRET`, `DB_*`).
2. Build the Docker image: `docker build -t attendance-service .`
3. Run migrations before starting the container.
4. The container exposes port `3000` and responds to `SIGTERM` for graceful shutdown.

```bash
docker build -t attendance-service:latest .
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  attendance-service:latest
```

---

## Security Notes

- All secrets are loaded from environment variables — never hard-coded.
- Passwords are hashed with bcrypt (configurable salt rounds).
- JWT auth middleware is wired up; add `authenticate` to routes that need it.
- Rate limiting is enabled globally (configurable via env).
- Helmet sets secure HTTP headers.
- Input validation strips unknown fields before reaching the service layer.
- SQL injection is prevented by Knex parameterised queries.
