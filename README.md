# Attendance Tracking Service

A production-ready REST API for tracking employee attendance — check-ins, check-outs, and reporting — built with Node.js and Express.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Docker](#docker)
- [Project Structure](#project-structure)

---

## Features

- **Employee Management** — CRUD operations with unique code and email enforcement
- **Attendance Tracking** — Check-in / check-out with automatic status detection (present, late, half-day)
- **Overtime Detection** — Automatically flags records exceeding standard work hours
- **Reporting** — Aggregated summary reports filterable by employee, date range, and department
- **Pagination & Filtering** — All list endpoints support pagination, filtering, and search
- **JWT Auth Placeholder** — Auth middleware ready to plug in your identity provider
- **OpenAPI/Swagger Docs** — Auto-generated and served at `/api-docs`
- **Structured Logging** — Winston with daily log rotation
- **Health & Metrics** — `/health` and `/metrics` endpoints for observability

---

## Architecture

```
src/
├── api/                    # HTTP Layer
│   ├── controllers/        # Request handling, response formatting
│   ├── middlewares/        # Auth, error handling, logging, validation
│   └── routes/             # Express router definitions + Swagger annotations
│
├── services/               # Business Logic Layer
│   ├── employeeService.js  # Employee business rules
│   └── attendanceService.js# Check-in/out logic, status derivation
│
├── repositories/           # Data Access Layer
│   ├── employeeRepository.js
│   └── attendanceRepository.js
│
├── db/                     # Database
│   ├── migrations/         # Knex migration files
│   └── seeds/              # Sample data
│
├── config/                 # Configuration
│   ├── env.js              # Centralized env vars
│   ├── knexfile.js         # DB config per environment
│   └── swagger.js          # OpenAPI spec
│
└── utils/                  # Shared utilities
    ├── errors.js           # Domain-specific error classes
    ├── logger.js           # Winston logger
    └── response.js         # Standardized response helpers
```

**Design principles:**
- **Clean Architecture** — Each layer has a single responsibility; dependencies flow inward
- **SOLID** — Services depend on repository interfaces, not implementations
- **Fail Fast** — DB connection is verified at startup; unhandled rejections crash the process
- **Operational Errors vs Crashes** — `AppError` subclasses are safe to surface to clients; unexpected errors return a generic 500

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)

### 1. Clone and install

```bash
git clone <repo-url>
cd attendance-tracking-service
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set DB_PASSWORD and JWT_SECRET
```

### 3. Run database migrations

```bash
npm run migrate
```

### 4. (Optional) Seed sample data

```bash
npm run seed
```

### 5. Start the server

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

The server starts on `http://localhost:3000`.
API docs are available at `http://localhost:3000/api-docs` (development only).

---

## Configuration

All configuration is driven by environment variables. See `.env.example` for the full list.

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `PORT` | `3000` | HTTP server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `attendance_db` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | — | Database password |
| `JWT_SECRET` | — | **Required in production** |
| `JWT_EXPIRES_IN` | `24h` | Access token lifetime |
| `LOG_LEVEL` | `info` | winston log level |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Requests per window |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated allowed origins |

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

### Employees

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/employees` | List employees (paginated, filterable) |
| `POST` | `/employees` | Create a new employee |
| `GET` | `/employees/:id` | Get employee by ID |
| `PUT` | `/employees/:id` | Update employee |
| `DELETE` | `/employees/:id` | Delete employee |
| `GET` | `/employees/departments` | List distinct departments |

**Query parameters for `GET /employees`:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter: `active`, `inactive`, `on_leave` |
| `department` | string | Filter by department name |
| `search` | string | Search name, email, employee code |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Page size (default: 20, max: 100) |

### Attendance

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/attendance/check-in` | Record employee check-in |
| `POST` | `/attendance/check-out` | Record employee check-out |
| `GET` | `/attendance` | List records (paginated, filterable) |
| `GET` | `/attendance/:id` | Get a specific record |
| `PUT` | `/attendance/:id` | Admin correction of a record |
| `DELETE` | `/attendance/:id` | Delete a record |
| `GET` | `/attendance/reports/summary` | Aggregated report |

**Check-in request body:**
```json
{
  "employeeId": "uuid",
  "notes": "Optional note",
  "location": "Office - Floor 3"
}
```

**Check-out request body:**
```json
{
  "employeeId": "uuid",
  "notes": "Optional note",
  "location": "Office - Floor 3"
}
```

**Query parameters for `GET /attendance`:**

| Param | Type | Description |
|-------|------|-------------|
| `employeeId` | UUID | Filter by employee |
| `status` | string | `present`, `absent`, `late`, `half_day`, `on_leave` |
| `dateFrom` | date | Start of date range (YYYY-MM-DD) |
| `dateTo` | date | End of date range (YYYY-MM-DD) |
| `department` | string | Filter by department |
| `page` / `limit` | integer | Pagination |

### Health & Metrics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness/readiness check |
| `GET` | `/metrics` | Process memory and uptime |

### Response Envelope

All responses follow a consistent structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "email", "message": "email must be a valid email address" }]
  }
}
```

**Error codes:**

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `CONFLICT` | 409 | Duplicate resource |
| `BAD_REQUEST` | 400 | Business rule violation |
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

---

## Database Schema

### `employees`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `employee_code` | VARCHAR(20) | Unique human-readable ID |
| `first_name` | VARCHAR(100) | |
| `last_name` | VARCHAR(100) | |
| `email` | VARCHAR(255) | Unique |
| `phone` | VARCHAR(30) | Optional |
| `department` | VARCHAR(100) | Optional |
| `position` | VARCHAR(100) | Optional |
| `status` | ENUM | `active`, `inactive`, `on_leave` |
| `hire_date` | DATE | Optional |
| `expected_check_in` | TIME | Used for late detection |
| `expected_check_out` | TIME | Used for overtime detection |
| `created_at` / `updated_at` | TIMESTAMPTZ | Auto-managed |

### `attendance_records`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `employee_id` | UUID (FK) | → `employees.id` |
| `date` | DATE | Unique with `employee_id` |
| `check_in` | TIMESTAMPTZ | |
| `check_out` | TIMESTAMPTZ | Null until checked out |
| `status` | ENUM | `present`, `absent`, `late`, `half_day`, `on_leave` |
| `work_hours` | DECIMAL(5,2) | Computed on check-out |
| `is_overtime` | BOOLEAN | True if `work_hours > 9` |
| `notes` | TEXT | Optional |
| `check_in_location` | VARCHAR(255) | Optional GPS/office info |
| `check_out_location` | VARCHAR(255) | Optional |
| `created_at` / `updated_at` | TIMESTAMPTZ | Auto-managed |

---

## Testing

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage report
npm run test:coverage
```

- **Unit tests** mock the repository layer and test service business logic in isolation
- **Integration tests** use an SQLite in-memory database, exercising the full Express stack via `supertest`

---

## Docker

### Start everything with Docker Compose

```bash
# Start PostgreSQL and the application
docker compose up -d

# Run migrations (first time or after new migrations)
docker compose --profile migrate run migrate

# Optional: start pgAdmin at http://localhost:5050
docker compose --profile tools up -d pgadmin

# View logs
docker compose logs -f app

# Stop
docker compose down
```

### Build and run the image manually

```bash
docker build -t attendance-tracking-service:latest .
docker run -p 3000:3000 --env-file .env attendance-tracking-service:latest
```

### Image details

- **Base:** `node:20-alpine` (minimal footprint)
- **Multi-stage build** — devDependencies are excluded from the final image
- **Non-root user** — runs as `appuser` (UID 1001) for security
- **HEALTHCHECK** — Docker monitors `/health` and restarts unhealthy containers

---

## Project Structure

```
attendance-tracking-service/
├── src/
│   ├── api/
│   │   ├── controllers/        # HTTP request handlers
│   │   ├── middlewares/        # auth, errorHandler, requestLogger, validate
│   │   └── routes/             # Express routers
│   ├── config/
│   │   ├── env.js              # Validated env config
│   │   ├── knexfile.js         # Knex per-environment DB config
│   │   └── swagger.js          # OpenAPI spec generation
│   ├── db/
│   │   ├── migrations/         # Knex migration files
│   │   └── seeds/              # Development seed data
│   ├── repositories/           # Database query layer
│   ├── services/               # Business logic layer
│   ├── utils/                  # errors.js, logger.js, response.js
│   ├── app.js                  # Express app setup
│   └── server.js               # Entry point, graceful shutdown
├── tests/
│   ├── unit/services/          # Mocked service unit tests
│   └── integration/            # Full-stack integration tests (SQLite)
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```
