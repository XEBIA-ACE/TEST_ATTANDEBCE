# Attendance Tracking Service

A production-ready REST API for managing employee attendance records — check-ins, check-outs, and reporting.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start (Docker)](#quick-start-docker)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [API Documentation](#api-documentation)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   HTTP Client                    │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────┐
│              Express API Layer                   │
│  Routes → Validators → Auth → Controllers        │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────┐
│            Business Logic Layer                  │
│         Services + Domain Utilities              │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────┐
│             Data Access Layer                    │
│      Repositories → Models → Knex → PostgreSQL   │
└──────────────────────────────────────────────────┘
```

**Clean Architecture** with strict layer separation:
- **API Layer** — HTTP concerns only (routing, validation, auth, request/response)
- **Business Layer** — Domain rules and use cases, no HTTP or DB awareness
- **Data Layer** — All database access via repository pattern

---

## Tech Stack

| Concern            | Library / Tool               |
|--------------------|------------------------------|
| Runtime            | Node.js 20                   |
| HTTP framework     | Express 4                    |
| Database           | PostgreSQL 16                |
| Query builder      | Knex.js                      |
| Validation         | Joi                          |
| Authentication     | JSON Web Tokens (jsonwebtoken)|
| Logging            | Winston + Daily Rotate File  |
| Documentation      | Swagger / OpenAPI 3.0        |
| Testing            | Jest + Supertest             |
| Container          | Docker + Docker Compose      |

---

## Quick Start (Docker)

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd attendance-tracking-service

# 2. Copy and customise environment variables
cp .env.example .env

# 3. Start all services (API + PostgreSQL)
docker compose up --build

# 4. Run database migrations
docker compose exec api npm run migrate

# 5. (Optional) Seed sample data
docker compose exec api npm run seed
```

The API is now available at **http://localhost:3000**
Swagger UI: **http://localhost:3000/api-docs**

---

## Local Setup

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run migrations
npm run migrate

# Seed sample data (optional)
npm run seed

# Start development server with hot-reload
npm run dev
```

---

## Environment Variables

| Variable                  | Description                        | Default           |
|---------------------------|------------------------------------|-------------------|
| `NODE_ENV`                | Runtime environment                | `development`     |
| `PORT`                    | HTTP port                          | `3000`            |
| `DB_HOST`                 | PostgreSQL host                    | `localhost`       |
| `DB_PORT`                 | PostgreSQL port                    | `5432`            |
| `DB_NAME`                 | Database name                      | `attendance_db`   |
| `DB_USER`                 | Database user                      | `postgres`        |
| `DB_PASSWORD`             | Database password                  | —                 |
| `JWT_SECRET`              | Secret for signing JWTs            | —                 |
| `JWT_EXPIRES_IN`          | Token lifetime                     | `1d`              |
| `LOG_LEVEL`               | Winston log level                  | `info`            |
| `CORS_ORIGIN`             | Allowed CORS origin                | `*`               |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window            | `100`             |

---

## Database Migrations

```bash
# Apply all pending migrations
npm run migrate

# Rollback the latest migration batch
npm run migrate:rollback

# Create a new migration file
npm run migrate:make migration_name

# Run seeds
npm run seed
```

---

## API Documentation

Interactive Swagger UI is available at `/api-docs` when the server is running.

Raw OpenAPI spec: `GET /api-docs.json`

---

## API Reference

All endpoints are prefixed with `/api/v1`.
Authentication: `Authorization: Bearer <token>` header required (except `/api/health`).

### Health

| Method | Path                | Description              | Auth |
|--------|---------------------|--------------------------|------|
| GET    | `/health`           | Liveness probe           | No   |
| GET    | `/health/ready`     | Readiness + DB check     | No   |
| GET    | `/health/metrics`   | Process metrics          | No   |

### Employees

| Method | Path                 | Description               | Role Required    |
|--------|----------------------|---------------------------|------------------|
| POST   | `/v1/employees`      | Create employee            | admin, hr        |
| GET    | `/v1/employees`      | List employees (paginated) | any              |
| GET    | `/v1/employees/:id`  | Get employee by ID         | any              |
| PUT    | `/v1/employees/:id`  | Update employee            | admin, hr        |
| DELETE | `/v1/employees/:id`  | Deactivate employee        | admin            |

**Query parameters for `GET /v1/employees`:**
- `page`, `pageSize` — Pagination
- `department` — Filter by department
- `employmentType` — full_time | part_time | contractor | intern
- `isActive` — true | false
- `search` — Full-text search on name/email
- `sortBy` — firstName | lastName | department | hireDate | createdAt
- `sortOrder` — asc | desc

### Attendance

| Method | Path                                  | Description                     | Role Required         |
|--------|---------------------------------------|---------------------------------|-----------------------|
| POST   | `/v1/attendance/check-in`             | Record employee check-in        | any                   |
| PATCH  | `/v1/attendance/:id/check-out`        | Record employee check-out       | any                   |
| GET    | `/v1/attendance`                      | List records (paginated)        | any                   |
| GET    | `/v1/attendance/:id`                  | Get single record               | any                   |
| GET    | `/v1/attendance/employees/:empId`     | Employee's attendance history   | any                   |
| GET    | `/v1/attendance/summary`              | Attendance report (date range)  | admin, hr, manager    |

**Query parameters for `GET /v1/attendance`:**
- `page`, `pageSize` — Pagination
- `employeeId` — Filter by employee
- `department` — Filter by department
- `startDate`, `endDate` — ISO date range
- `status` — checked_in | checked_out | absent

### Request/Response Examples

**Check In**
```json
POST /api/v1/attendance/check-in
{
  "employeeId": "550e8400-e29b-41d4-a716-446655440000",
  "notes": "Working from office",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "New York, NY"
  }
}
```

**Response**
```json
{
  "status": "success",
  "data": {
    "record": {
      "id": "b3d5e7f9-...",
      "employeeId": "550e8400-...",
      "firstName": "Alice",
      "lastName": "Smith",
      "department": "Engineering",
      "checkInTime": "2024-06-15T09:00:00.000Z",
      "checkOutTime": null,
      "workedHours": null,
      "status": "checked_in"
    }
  }
}
```

---

## Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests (requires running DB)
INTEGRATION_TEST=true npm run test:integration

# Coverage report
npm run test:coverage
```

Unit tests mock all dependencies and run without a database.
Integration tests require `INTEGRATION_TEST=true` and a PostgreSQL test database (`DB_NAME_TEST`).

---

## Project Structure

```
attendance-tracking-service/
├── src/
│   ├── api/                    # HTTP layer
│   │   ├── controllers/        # Request handlers
│   │   ├── middlewares/        # Auth, validation, logging, errors
│   │   ├── routes/             # Route definitions
│   │   └── validators/         # Joi schemas
│   ├── business/               # Domain logic
│   │   ├── services/           # Use cases
│   │   └── utils/              # Pure utilities (dateUtils, etc.)
│   ├── data/                   # Data access
│   │   ├── migrations/         # Knex migration files
│   │   ├── models/             # Column mapping (DB ↔ JS)
│   │   ├── repositories/       # Query encapsulation
│   │   └── seeds/              # Sample data
│   ├── config/                 # Database, logger, Swagger
│   └── app.js                  # Express application factory
├── tests/
│   ├── unit/                   # Unit tests (no I/O)
│   └── integration/            # API integration tests
├── Dockerfile                  # Multi-stage production image
├── docker-compose.yml          # Local development stack
├── knexfile.js                 # Database configuration
├── server.js                   # Entry point with graceful shutdown
└── .env.example                # Environment variable template
```
