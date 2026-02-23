# Attendance Tracking Service

A production-ready REST API for managing employee attendance records, built with **Node.js**, **Express**, and **PostgreSQL**.

## Features

- Employee management (CRUD with soft-delete)
- Check-in / check-out tracking with automatic late detection
- Attendance reports and summary statistics
- JWT-based authentication with role-based access control
- Paginated, filterable list endpoints
- Input validation with Joi
- Structured logging (Winston)
- OpenAPI / Swagger documentation
- Health and readiness probes
- Docker-first setup with multi-stage builds

---

## Architecture

```
src/
├── api/
│   ├── controllers/      # HTTP layer — parse request, call service, send response
│   ├── middleware/        # auth, validation, error handling, request logging
│   └── routes/           # Express router with Swagger JSDoc annotations
├── services/             # Business logic — domain rules, orchestration
├── repositories/         # Data access — all SQL lives here
├── models/               # Domain objects with toJSON() serialisation
├── validators/           # Joi schemas for request validation
├── config/               # database pool, logger, swagger spec
└── db/
    ├── migrate.js         # CLI migration runner
    └── migrations/        # Numbered .sql files applied in order
```

Clean Architecture: **Controller → Service → Repository → Database**

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
# Edit .env with your database credentials and a strong JWT_SECRET
```

### 3. Start with Docker (recommended)

```bash
# Start PostgreSQL + API (with hot-reload)
docker compose up

# Run migrations
docker compose exec api npm run migrate
```

### 4. Start without Docker

```bash
# Ensure PostgreSQL is running and DATABASE credentials in .env are correct
npm run migrate       # apply DB migrations
npm run dev           # start with nodemon (hot-reload)
```

The API is available at `http://localhost:3000`

---

## API Documentation

Interactive Swagger UI: **`http://localhost:3000/api-docs`**

OpenAPI JSON spec: `http://localhost:3000/api-docs.json`

---

## API Reference

All endpoints are prefixed with `/api/v1` and require `Authorization: Bearer <token>`.

### Authentication

> **Note:** Authentication is implemented via JWT middleware. Issue tokens externally (e.g., via an Auth service) and pass them as a Bearer token.

---

### Employees

| Method | Endpoint                         | Role Required  | Description                      |
|--------|----------------------------------|----------------|----------------------------------|
| GET    | `/api/v1/employees`              | any            | List employees (paginated)        |
| GET    | `/api/v1/employees/:id`          | any            | Get a single employee             |
| POST   | `/api/v1/employees`              | admin, hr      | Create a new employee             |
| PATCH  | `/api/v1/employees/:id`          | admin, hr      | Update an employee                |
| DELETE | `/api/v1/employees/:id/deactivate` | admin        | Soft-delete (deactivate) employee |

**Query parameters for `GET /employees`:**

| Param       | Type    | Description                       |
|-------------|---------|-----------------------------------|
| page        | integer | Page number (default: 1)          |
| limit       | integer | Items per page (default: 20)      |
| department  | string  | Filter by department              |
| is_active   | boolean | Filter by active status           |
| search      | string  | Full-text search on name/email    |

---

### Attendance

| Method | Endpoint                               | Role Required  | Description                   |
|--------|----------------------------------------|----------------|-------------------------------|
| GET    | `/api/v1/attendance`                   | any            | List records (paginated)      |
| GET    | `/api/v1/attendance/report`            | any            | Summary report for a period   |
| GET    | `/api/v1/attendance/:id`               | any            | Get a single record           |
| POST   | `/api/v1/attendance/check-in`          | any            | Record employee check-in      |
| PATCH  | `/api/v1/attendance/:id/check-out`     | any            | Record employee check-out     |
| POST   | `/api/v1/attendance`                   | admin, hr      | Manually create a record      |
| PATCH  | `/api/v1/attendance/:id`               | admin, hr      | Update a record               |
| DELETE | `/api/v1/attendance/:id`               | admin          | Delete a record               |

**Check-in payload:**

```json
{
  "employee_id": "uuid",
  "check_in_time": "2024-01-15T09:00:00Z",  // optional, defaults to now
  "notes": "Working from home"               // optional
}
```

**Attendance statuses:** `present` | `absent` | `late` | `half_day` | `holiday` | `leave`

**Late detection:** Automatic — check-ins after 09:30 are marked `late`.

---

### Health & Metrics

| Endpoint          | Description                                     |
|-------------------|-------------------------------------------------|
| `GET /health`     | Liveness probe (process alive)                  |
| `GET /health/ready` | Readiness probe (DB connection verified)      |
| `GET /metrics`    | Basic process metrics (memory, uptime)          |

---

## Example Requests

### Check in an employee

```bash
curl -X POST http://localhost:3000/api/v1/attendance/check-in \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employee_id": "your-employee-uuid"}'
```

### Get attendance report

```bash
curl "http://localhost:3000/api/v1/attendance/report?start_date=2024-01-01&end_date=2024-01-31" \
  -H "Authorization: Bearer $TOKEN"
```

### Create an employee

```bash
curl -X POST http://localhost:3000/api/v1/employees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_code": "EMP-001",
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane@example.com",
    "department": "Engineering",
    "position": "Software Engineer",
    "hire_date": "2024-01-15"
  }'
```

---

## Testing

```bash
npm test                   # all tests
npm run test:unit          # unit tests only
npm run test:integration   # integration tests only
npm run test:coverage      # with coverage report
```

Tests use Jest and run without a database (repositories are mocked via `jest.mock()`).

---

## Environment Variables

| Variable                   | Default        | Description                                 |
|----------------------------|----------------|---------------------------------------------|
| `NODE_ENV`                 | development    | Runtime environment                         |
| `PORT`                     | 3000           | HTTP port                                   |
| `API_PREFIX`               | /api/v1        | URL prefix for API routes                   |
| `DB_HOST`                  | localhost      | PostgreSQL host                             |
| `DB_PORT`                  | 5432           | PostgreSQL port                             |
| `DB_NAME`                  | attendance_db  | Database name                               |
| `DB_USER`                  | postgres       | Database user                               |
| `DB_PASSWORD`              | —              | Database password (required)                |
| `DB_POOL_MIN`              | 2              | Min connection pool size                    |
| `DB_POOL_MAX`              | 10             | Max connection pool size                    |
| `DB_SSL`                   | false          | Enable SSL (`true` for production cloud DB) |
| `JWT_SECRET`               | —              | Secret for signing JWTs (min 32 chars)      |
| `JWT_EXPIRES_IN`           | 24h            | JWT expiry duration                         |
| `LOG_LEVEL`                | info           | Logging level (debug/info/warn/error)       |
| `RATE_LIMIT_WINDOW_MS`     | 900000         | Rate limit window (15 minutes)              |
| `RATE_LIMIT_MAX_REQUESTS`  | 100            | Max requests per window per IP              |
| `CORS_ORIGIN`              | *              | Allowed origins (comma-separated)           |

---

## Docker

```bash
# Development (with hot-reload)
docker compose up

# Production build
docker build --target production -t attendance-tracking-service:latest .
docker run -p 3000:3000 --env-file .env attendance-tracking-service:latest

# Start with pgAdmin UI
docker compose --profile tools up
```

---

## Database Migrations

```bash
npm run migrate          # apply pending migrations
```

Migrations are plain `.sql` files in `src/db/migrations/`, applied in alphabetical order. Applied migrations are tracked in the `schema_migrations` table.

---

## Project Structure

```
attendance-tracking-service/
├── src/
│   ├── api/
│   │   ├── controllers/           # HTTP request handlers
│   │   ├── middleware/            # auth, validation, error, logging
│   │   └── routes/                # Express routers + Swagger annotations
│   ├── services/                  # Business logic layer
│   ├── repositories/              # Data access layer (SQL)
│   ├── models/                    # Domain models
│   ├── validators/                # Joi validation schemas
│   ├── config/                    # database, logger, swagger
│   ├── db/
│   │   ├── migrate.js             # Migration runner
│   │   └── migrations/            # SQL migration files
│   ├── app.js                     # Express app setup
│   └── server.js                  # Entry point + graceful shutdown
├── tests/
│   ├── unit/services/             # Service layer unit tests
│   └── integration/               # API integration tests
├── Dockerfile                     # Multi-stage Docker build
├── docker-compose.yml             # Local dev stack
├── .env.example                   # Environment template
└── package.json
```
