# Attendance Tracking Service

A production-ready REST API for tracking employee attendance, built with **Node.js** and **Express**.

## Features

- Employee management (CRUD) with soft delete
- Check-in / check-out recording with automatic hours calculation
- Attendance reports per employee and per department
- JWT authentication with role-based authorization
- Input validation via Joi
- Structured logging with Winston + daily log rotation
- Prometheus metrics endpoint
- Swagger/OpenAPI documentation
- Docker + Docker Compose setup
- Multi-environment configuration (dev, test, prod)
- Graceful shutdown and database connection pooling

---

## Architecture

```
src/
├── api/                      # HTTP layer
│   ├── controllers/          # Request/response handling
│   ├── middlewares/          # auth, validation, logging, errors
│   └── routes/               # Express route definitions + Joi schemas
├── config/                   # env, database, knex, swagger
├── domain/
│   ├── models/               # Pure business entities (Employee, Attendance)
│   └── services/             # Business logic (EmployeeService, AttendanceService)
├── infrastructure/
│   ├── database/
│   │   ├── migrations/       # Knex schema migrations
│   │   └── seeds/            # Development seed data
│   └── repositories/         # Data access layer (SQL queries)
├── utils/                    # Logger, metrics, AppError
├── app.js                    # Express app setup
└── server.js                 # Server entry point + graceful shutdown
```

**Layer responsibilities:**

| Layer | Responsibility |
|-------|---------------|
| Routes | URL mapping, Joi validation schemas |
| Controllers | Parse request, call service, format response |
| Services | Business rules, orchestration |
| Repositories | SQL queries, database mapping |
| Models | Domain entities, computed properties |

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Clone & install

```bash
git clone <repo-url>
cd attendance-tracking-service
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

### 3. Run database migrations

```bash
npm run migrate
npm run seed      # Optional: load sample data
```

### 4. Start the server

```bash
npm run dev       # Development (hot reload via nodemon)
npm start         # Production
```

The API will be available at `http://localhost:3000`.

---

## Docker Setup

### Start everything with Docker Compose

```bash
# Start app + PostgreSQL
docker compose up -d

# Run migrations in a one-off container
docker compose --profile migrate up migrate

# Access pgAdmin (optional)
docker compose --profile tools up pgadmin
# Open http://localhost:5050 (admin@example.com / admin)
```

### Build the production image only

```bash
docker build -t attendance-tracking-service .
docker run -p 3000:3000 --env-file .env attendance-tracking-service
```

---

## API Documentation

Interactive Swagger UI: **`http://localhost:3000/api-docs`**

Raw OpenAPI spec: **`http://localhost:3000/api-docs.json`**

### Authentication

All endpoints (except health/metrics) require a Bearer JWT:

```
Authorization: Bearer <token>
```

> In development, generate a token with any payload signed by your `JWT_SECRET`.

---

## API Reference

### Health & Observability

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/health` | Liveness probe | No |
| GET | `/health/ready` | Readiness probe (checks DB) | No |
| GET | `/metrics` | Prometheus metrics | No |

### Employees — `/api/v1/employees`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/employees` | List employees (paginated, filterable) |
| POST | `/api/v1/employees` | Create employee |
| GET | `/api/v1/employees/:id` | Get employee by ID |
| PATCH | `/api/v1/employees/:id` | Update employee |
| DELETE | `/api/v1/employees/:id` | Soft-delete employee |
| GET | `/api/v1/employees/departments` | List unique departments |

**Query parameters for GET /employees:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Results per page (default: 20, max: 100) |
| `status` | string | Filter: `active`, `inactive`, `on_leave` |
| `department` | string | Filter by department name |
| `search` | string | Full-text search on name, email, employee number |

**Create Employee payload:**

```json
{
  "employee_number": "EMP001",
  "first_name": "Alice",
  "last_name": "Johnson",
  "email": "alice.johnson@company.com",
  "department": "Engineering",
  "position": "Senior Software Engineer",
  "status": "active",
  "hire_date": "2023-01-15"
}
```

### Attendance — `/api/v1/attendance`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/attendance` | List records (paginated, filterable) |
| GET | `/api/v1/attendance/:id` | Get record by ID |
| POST | `/api/v1/attendance/check-in` | Record employee check-in |
| POST | `/api/v1/attendance/check-out` | Record employee check-out |
| PUT | `/api/v1/attendance/:employeeId/:date` | Admin: create/update record for date |
| DELETE | `/api/v1/attendance/:id` | Delete attendance record |

**Check-in payload:**

```json
{
  "employee_id": "550e8400-e29b-41d4-a716-446655440000",
  "check_in": "2024-01-15T09:00:00Z",  // optional, defaults to now
  "notes": "On-site"
}
```

**Check-out payload:**

```json
{
  "employee_id": "550e8400-e29b-41d4-a716-446655440000",
  "check_out": "2024-01-15T17:30:00Z"  // optional, defaults to now
}
```

### Reports — `/api/v1/attendance/reports`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/attendance/reports/employee/:employeeId` | Employee summary (date range) |
| GET | `/api/v1/attendance/reports/department` | Department stats for a date |

**Employee summary response:**

```json
{
  "success": true,
  "data": {
    "employee_id": "uuid",
    "date_from": "2024-01-01",
    "date_to": "2024-01-31",
    "total_days": 23,
    "total_hours": 184.5,
    "breakdown": {
      "present": { "count": 20, "total_hours": 160 },
      "late":    { "count": 2,  "total_hours": 14.5 },
      "absent":  { "count": 1,  "total_hours": 0 }
    }
  }
}
```

---

## Database Schema

### `employees`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK, default gen_random_uuid() |
| `employee_number` | varchar(50) | NOT NULL, UNIQUE |
| `first_name` | varchar(100) | NOT NULL |
| `last_name` | varchar(100) | NOT NULL |
| `email` | varchar(255) | NOT NULL, UNIQUE |
| `department` | varchar(100) | NOT NULL |
| `position` | varchar(100) | NOT NULL |
| `status` | enum | active / inactive / on_leave |
| `hire_date` | date | NOT NULL |
| `created_at` | timestamp | NOT NULL |
| `updated_at` | timestamp | NOT NULL |
| `deleted_at` | timestamp | Nullable (soft delete) |

### `attendance_records`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID | PK |
| `employee_id` | UUID | FK → employees(id) ON DELETE CASCADE |
| `date` | date | NOT NULL |
| `check_in` | timestamp | Nullable |
| `check_out` | timestamp | Nullable |
| `status` | enum | present / absent / late / half_day / on_leave |
| `total_hours` | decimal(5,2) | Nullable |
| `notes` | text | Nullable |
| `created_at` | timestamp | NOT NULL |
| `updated_at` | timestamp | NOT NULL |

**Unique constraint:** `(employee_id, date)` — one record per employee per day.

---

## Testing

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests (requires test database)
NODE_ENV=test npm run test:integration

# Coverage report
npm run test:coverage
```

---

## Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment: development / test / production |
| `PORT` | `3000` | HTTP server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `attendance_db` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | — | Database password |
| `JWT_SECRET` | — | **Required in prod.** JWT signing secret |
| `JWT_EXPIRES_IN` | `24h` | Token expiry duration |
| `LOG_LEVEL` | `info` | Winston log level |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| `METRICS_ENABLED` | `true` | Enable Prometheus metrics |

---

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start dev server with hot reload |
| `npm run migrate` | Run pending migrations |
| `npm run migrate:rollback` | Rollback last migration batch |
| `npm run seed` | Seed development data |
| `npm test` | Run all tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint` | Run ESLint |
