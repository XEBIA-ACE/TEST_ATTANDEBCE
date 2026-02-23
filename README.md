# Attendance Tracking Service

A production-ready REST API for managing employee attendance — check-ins, check-outs, records management, and reporting — built with **Node.js**, **Express**, **PostgreSQL**, and **Knex.js**.

---

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## Architecture

```
src/
├── api/                    # HTTP layer (Express routes, controllers, middleware)
│   ├── controllers/        # Thin handlers — delegate to services, format responses
│   ├── middlewares/        # Auth, validation, error handling, request logging
│   ├── routes/             # Route definitions with Swagger JSDoc annotations
│   └── validators/         # Joi schemas for request validation
├── config/                 # Database, logger, Swagger configuration
├── domain/
│   ├── models/             # Pure domain models with computed properties
│   └── services/           # Business logic (check-in rules, status derivation, reports)
└── infrastructure/
    ├── database/
    │   ├── migrations/     # Knex schema migrations
    │   └── seeds/          # Development data seeds
    └── repositories/       # Data access layer — all SQL lives here
```

The service follows **Clean Architecture** principles:

- **API layer** handles HTTP concerns only.
- **Service layer** contains all business rules and orchestration.
- **Repository layer** encapsulates all database queries.
- **Domain models** are plain JavaScript classes with no framework coupling.

---

## Features

- **Employee CRUD** — full lifecycle management with soft-delete
- **Check-in / Check-out** — single daily session with automatic late-arrival detection
- **Attendance records** — manual backfill and admin overrides
- **Reports** — per-employee summaries and department-level daily snapshots
- **JWT authentication** — Bearer token guard on all endpoints
- **Input validation** — Joi schemas with descriptive error messages
- **Structured logging** — Winston with daily log rotation
- **Rate limiting** — configurable request throttling
- **Swagger UI** — interactive API docs at `/api-docs`
- **Health & metrics** — readiness and runtime metrics endpoints
- **Docker** — multi-stage Dockerfile and docker-compose for one-command startup

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| PostgreSQL | ≥ 14 |
| Docker & Docker Compose | any recent version |

---

## Quick Start (Docker)

```bash
# Clone the repository
git clone <repo-url>
cd attendance-tracking-service

# Copy environment file
cp .env.example .env

# Start all services (app + PostgreSQL)
docker compose up -d

# Run migrations and seed data
docker compose exec app npm run migrate
docker compose exec app npm run seed
```

The API is now available at **http://localhost:3000**.
Interactive docs: **http://localhost:3000/api-docs**

> To also start Adminer (database UI): `docker compose --profile tools up -d`
> Adminer: http://localhost:8080

---

## Local Development

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env — set DB_* variables to your local PostgreSQL instance

# Run migrations
npm run migrate

# Seed sample data (optional)
npm run seed

# Start with hot-reload
npm run dev
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `3000` | HTTP port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `attendance_db` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `JWT_SECRET` | — | **Required in production** |
| `JWT_EXPIRES_IN` | `8h` | Token lifetime |
| `LOG_LEVEL` | `info` | Winston log level |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Requests per window |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (ms) |

---

## API Documentation

### Authentication

All endpoints require a JWT Bearer token:

```
Authorization: Bearer <token>
```

### Base URL

```
/api/v1
```

### Endpoints

#### Employees

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/employees` | List employees (paginated) |
| `GET` | `/employees/departments` | List distinct departments |
| `GET` | `/employees/:id` | Get employee by ID |
| `POST` | `/employees` | Create employee |
| `PATCH` | `/employees/:id` | Update employee |
| `DELETE` | `/employees/:id` | Soft-delete employee |

**Query parameters for `GET /employees`:**
- `page`, `limit` — pagination
- `department` — filter by department name
- `status` — `active` | `inactive` | `on_leave`
- `search` — full-text search across name, email, code

#### Attendance

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/attendance` | List records (paginated) |
| `GET` | `/attendance/:id` | Get record by ID |
| `POST` | `/attendance/check-in/:employeeId` | Record check-in (auto-detects late) |
| `POST` | `/attendance/check-out/:employeeId` | Record check-out (computes total hours) |
| `POST` | `/attendance` | Manually create a record (admin) |
| `PATCH` | `/attendance/:id` | Update a record |
| `DELETE` | `/attendance/:id` | Delete a record |

**Query parameters for `GET /attendance`:**
- `employee_id`, `start_date`, `end_date`, `status`, `page`, `limit`

#### Reports

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/reports/employee/:employeeId/summary` | Employee summary over a date range |
| `GET` | `/reports/department/summary` | Department summary for a date |

**Query parameters for employee summary:** `start_date`, `end_date` (required)
**Query parameters for department summary:** `date` (defaults to today)

#### System

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness/readiness check |
| `GET` | `/metrics` | Process memory and uptime metrics |
| `GET` | `/api-docs` | Swagger UI |

### Example Requests

```bash
# Check in
curl -X POST http://localhost:3000/api/v1/attendance/check-in/<employee-id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"notes": "On time"}'

# Employee attendance summary
curl "http://localhost:3000/api/v1/reports/employee/<id>/summary?start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

---

## Database Schema

### `employees`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto-generated |
| `employee_code` | VARCHAR(20) | Unique, auto-assigned if omitted |
| `first_name` | VARCHAR(100) | |
| `last_name` | VARCHAR(100) | |
| `email` | VARCHAR(255) | Unique |
| `department` | VARCHAR(100) | Nullable |
| `position` | VARCHAR(100) | Nullable |
| `status` | ENUM | `active`, `inactive`, `on_leave` |
| `hire_date` | DATE | Nullable |
| `deleted_at` | TIMESTAMP | Soft-delete marker |
| `created_at` | TIMESTAMP | Auto |
| `updated_at` | TIMESTAMP | Auto |

### `attendance_records`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto-generated |
| `employee_id` | UUID FK | References `employees.id` |
| `date` | DATE | |
| `check_in` | TIMESTAMP | Required |
| `check_out` | TIMESTAMP | Nullable |
| `status` | ENUM | `present`, `absent`, `late`, `half_day`, `on_leave` |
| `notes` | TEXT | Nullable |
| `created_at` | TIMESTAMP | Auto |
| `updated_at` | TIMESTAMP | Auto |

Unique constraint: `(employee_id, date)` — one record per employee per day.

---

## Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage report
npm run test:coverage
```

Tests use **Jest** and **Supertest**. Unit tests mock repository dependencies; integration tests mock the service layer and exercise the full HTTP stack.

---

## Project Structure

```
attendance-tracking-service/
├── src/
│   ├── api/
│   │   ├── controllers/        # HTTP handlers
│   │   ├── middlewares/        # auth, errorHandler, validate, requestLogger
│   │   ├── routes/             # Express routers with Swagger annotations
│   │   └── validators/         # Joi validation schemas
│   ├── config/
│   │   ├── database.js         # Knex singleton
│   │   ├── logger.js           # Winston logger
│   │   └── swagger.js          # OpenAPI spec
│   ├── domain/
│   │   ├── models/             # Employee, Attendance domain models
│   │   └── services/           # employeeService, attendanceService, reportService
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── migrations/     # Schema migrations
│   │   │   └── seeds/          # Dev data
│   │   └── repositories/       # employeeRepository, attendanceRepository
│   └── app.js                  # Express application entry point
├── tests/
│   ├── unit/                   # Isolated service and model tests
│   ├── integration/            # HTTP endpoint tests
│   └── setup.js                # Jest global setup
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── knexfile.js
├── package.json
└── README.md
```
