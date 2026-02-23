# Attendance Tracking Service

A production-ready REST API for tracking employee attendance – check-ins, check-outs, status management, and reporting.

Built with **Node.js 20**, **Express 4**, **Sequelize 6**, and **SQLite** (dev) / **PostgreSQL** (prod).

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Running with Docker](#running-with-docker)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## Features

- Employee CRUD with soft-delete
- Daily check-in / check-out with automatic worked-hours calculation
- Automatic late-arrival detection (configurable threshold)
- Half-day detection when worked hours < 50% of expected daily hours
- Paginated, filterable attendance records
- Attendance summary reports by date range
- Structured JSON logging (Winston + daily log rotation)
- OpenAPI 3.0 documentation (Swagger UI)
- JWT authentication scaffold
- Rate limiting, CORS, helmet security headers
- SQLite for development, PostgreSQL for production
- Multi-stage Docker image (~160 MB final layer)
- Health and readiness endpoints

---

## Architecture

```
src/
├── api/              # HTTP layer (routes, controllers, middleware, validators)
├── business/         # Business logic (services)
├── data/             # Data access (models, repositories, migrations, seeders)
├── config/           # App, DB, and Swagger configuration
└── utils/            # Logger, response helper, AppError
```

The service follows **Clean Architecture** with strict layer separation:

```
HTTP Request
    ↓
Router → Middleware (auth, validate, rate-limit)
    ↓
Controller          (HTTP ↔ Service translation only)
    ↓
Service             (all business rules live here)
    ↓
Repository          (all DB queries live here)
    ↓
Sequelize Model     (schema definition)
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.0.0 |
| npm | ≥ 9 |
| Docker & Docker Compose | optional |

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd attendance-tracking-service
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values (JWT_SECRET is required)
```

### 3. Start the server

```bash
# Development (auto-restarts on change)
npm run dev

# Production
npm start
```

The server auto-creates the SQLite database and syncs the schema on startup in development mode.

### 4. Seed sample data (optional)

```bash
npm run seed
```

### 5. Open API docs

```
http://localhost:3000/api-docs
```

---

## Configuration

All configuration is driven by environment variables. Copy `.env.example` to `.env` and update the values.

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development`, `staging`, or `production` |
| `PORT` | `3000` | HTTP port |
| `DB_DIALECT` | `sqlite` | `sqlite` or `postgres` |
| `DB_STORAGE` | `./data/attendance.db` | SQLite file path |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `attendance_db` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | *(required)* | Database password |
| `JWT_SECRET` | *(required in prod)* | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | `8h` | Token TTL |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `LOG_LEVEL` | `info` | `error`, `warn`, `info`, `http`, `debug` |
| `LOG_DIR` | `./logs` | Log file directory |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |

---

## Running with Docker

### Development (SQLite – no external DB needed)

```bash
# Copy and adjust env vars
cp .env.example .env

docker build --target builder -t attendance-dev .
docker run -p 3000:3000 --env-file .env attendance-dev node src/app.js
```

### Full stack with PostgreSQL

```bash
docker compose up --build
```

- API:      http://localhost:3000
- API docs: http://localhost:3000/api-docs
- Health:   http://localhost:3000/health

### Include pgAdmin (optional GUI)

```bash
docker compose --profile tools up
# pgAdmin: http://localhost:5050  (admin@example.com / admin)
```

### Production image

```bash
docker build --target runner -t attendance-tracking-service:latest .
```

---

## API Reference

All endpoints are prefixed with `/api/v1`. Full interactive documentation is available at `/api-docs`.

### Authentication

Protected endpoints require a `Bearer` JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

> The current JWT implementation is a placeholder. Integrate with your identity provider (Auth0, Keycloak, custom login endpoint, etc.).

---

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Liveness check |
| GET | `/health/ready` | No | Readiness check (DB ping) |

---

### Employees

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/employees` | List employees (paginated) |
| POST | `/api/v1/employees` | Create employee |
| GET | `/api/v1/employees/:id` | Get employee by ID |
| PATCH | `/api/v1/employees/:id` | Update employee |
| DELETE | `/api/v1/employees/:id` | Soft-delete employee |

**Query params for GET /employees:**
- `department` – filter by department name
- `isActive` – `true` or `false`
- `search` – full-text search on name, email, or code
- `page` (default: 1), `limit` (default: 20, max: 100)

---

### Attendance

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/attendance/check-in` | Employee check-in |
| POST | `/api/v1/attendance/check-out` | Employee check-out |
| GET | `/api/v1/attendance/report` | Attendance summary report |
| GET | `/api/v1/attendance` | List records (paginated) |
| POST | `/api/v1/attendance` | Manually create a record (admin) |
| GET | `/api/v1/attendance/:id` | Get single record |
| PATCH | `/api/v1/attendance/:id` | Update record (admin) |
| DELETE | `/api/v1/attendance/:id` | Delete record (admin) |

**Check-in request body:**
```json
{ "employeeId": "uuid" }
```

**Report query params:**
- `startDate` *(required)* – ISO date, e.g. `2024-01-01`
- `endDate` *(required)* – ISO date, e.g. `2024-01-31`
- `employeeId` *(optional)* – filter to a single employee; omit for company-wide

**Report response example:**
```json
{
  "success": true,
  "data": {
    "employeeId": "uuid-or-null",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "summary": {
      "totalDays": 23,
      "presentDays": 20,
      "absentDays": 1,
      "lateDays": 2,
      "halfDays": 0,
      "onLeaveDays": 0,
      "totalWorkedHours": 167.5
    }
  }
}
```

---

### Status values

| Status | Description |
|--------|-------------|
| `present` | Checked in on time |
| `late` | Checked in after 09:15 |
| `absent` | No check-in for the day |
| `half_day` | Worked < 50% of expected daily hours |
| `on_leave` | Manually set by administrator |

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

Integration tests use an in-memory SQLite database and do not require any running services.

---

## Project Structure

```
attendance-tracking-service/
├── src/
│   ├── api/
│   │   ├── controllers/        # HTTP request handlers
│   │   ├── middlewares/        # auth, validation, logging, error handling
│   │   ├── routes/             # Express routers + Swagger JSDoc
│   │   └── validators/         # Joi schemas
│   ├── business/
│   │   └── services/           # Business rules and orchestration
│   ├── config/                 # app, database, swagger configuration
│   ├── data/
│   │   ├── models/             # Sequelize model definitions
│   │   ├── repositories/       # Database query abstraction
│   │   ├── migrations/         # Schema migration runner
│   │   └── seeders/            # Development seed data
│   ├── utils/                  # Logger, AppError, ResponseHelper
│   └── app.js                  # Express app setup + server bootstrap
├── tests/
│   ├── unit/                   # Service and utility unit tests
│   ├── integration/            # Full HTTP integration tests (supertest)
│   └── setup.js                # Test environment variables
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── jest.config.js
├── package.json
└── README.md
```
