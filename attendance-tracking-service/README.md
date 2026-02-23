# Attendance Tracking Service

A production-ready REST API service for tracking employee attendance, built with **Node.js** and **Express**.

## Features

- Employee management (CRUD with soft-delete)
- Daily check-in / check-out recording
- Automatic calculation of total hours worked
- Attendance reports and summaries by employee / date range
- JWT-based authentication with role-based access control (admin, manager, employee)
- Request validation with Joi
- Structured logging (Winston + Morgan)
- OpenAPI / Swagger documentation
- Health, readiness, and metrics endpoints
- Dockerised for local development (SQLite) and production (PostgreSQL)

---

## Architecture

```
src/
├── api/
│   ├── controllers/     # HTTP request handlers (thin layer)
│   ├── middleware/      # Auth, validation, logging, error handling
│   └── routes/          # Express routers with OpenAPI annotations
├── services/            # Business logic layer
├── repositories/        # Data access layer (Knex queries)
├── models/              # Schema constants & Joi validation schemas
├── config/              # Database, Swagger, env configuration
└── utils/               # Logger, error classes, pagination helpers
migrations/              # Knex database migrations
tests/
├── unit/                # Service layer tests with mocked repositories
└── integration/         # End-to-end route tests against in-memory SQLite
```

**Request flow:** `Route → Middleware → Controller → Service → Repository → DB`

---

## Quick Start (Local, SQLite)

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — defaults work for local SQLite development
```

### 3. Run database migrations

```bash
npm run migrate
```

### 4. Start the server

```bash
npm run dev     # development (nodemon)
npm start       # production
```

The API will be available at `http://localhost:3000`.

Interactive API docs: `http://localhost:3000/api-docs`

---

## Quick Start (Docker + PostgreSQL)

```bash
# Start PostgreSQL + app
docker-compose up --build

# With pgAdmin GUI
docker-compose --profile tools up --build
```

- API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs
- pgAdmin: http://localhost:5050 (admin@example.com / admin)

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Authentication

Include a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

> **Note:** A full `/auth/login` endpoint is scaffolded as a placeholder. Generate a token programmatically using `generateToken()` from `src/api/middleware/auth.middleware.js` for testing.

---

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Liveness check |
| GET | `/health/ready` | No | Readiness check (DB connectivity) |
| GET | `/health/metrics` | No | Runtime metrics (memory, uptime) |

---

### Employees

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/employees` | Any | List employees (paginated, filterable) |
| GET | `/employees/:id` | Any | Get employee details |
| POST | `/employees` | admin, manager | Create employee |
| PATCH | `/employees/:id` | admin, manager | Update employee |
| DELETE | `/employees/:id` | admin | Soft-delete employee |

**Query parameters for `GET /employees`:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by `active`, `inactive`, `on_leave` |
| `department` | string | Filter by department name |
| `search` | string | Full-text search on name, email, code |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Results per page (default: 20, max: 100) |

**Create Employee example:**

```json
POST /api/v1/employees
{
  "employee_code": "EMP-001",
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@company.com",
  "department": "Engineering",
  "position": "Software Engineer",
  "hire_date": "2024-01-15",
  "status": "active"
}
```

---

### Attendance

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/attendance` | Any | List records (paginated, filterable) |
| GET | `/attendance/:id` | Any | Get single record |
| POST | `/attendance/check-in` | Any | Record employee check-in |
| POST | `/attendance/check-out` | Any | Record employee check-out |
| POST | `/attendance` | admin, manager | Manually create a record |
| PATCH | `/attendance/:id` | admin, manager | Update a record |
| DELETE | `/attendance/:id` | admin | Delete a record |
| GET | `/attendance/summary/:employee_id` | Any | Attendance summary for an employee |

**Check-in example:**

```json
POST /api/v1/attendance/check-in
{
  "employee_id": "a1b2c3d4-...",
  "notes": "Working remotely",
  "location": "Home"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "...",
    "employee_id": "...",
    "date": "2024-02-01",
    "check_in": "2024-02-01T09:01:23.000Z",
    "check_out": null,
    "status": "present",
    "total_hours": null
  }
}
```

**Summary example:**

```
GET /api/v1/attendance/summary/{employee_id}?date_from=2024-02-01&date_to=2024-02-29
```

```json
{
  "success": true,
  "data": {
    "employee": { "name": "Jane Doe", "employee_code": "EMP-001" },
    "date_from": "2024-02-01",
    "date_to": "2024-02-29",
    "total_days": 20,
    "total_hours": 158.5,
    "by_status": {
      "present": 17,
      "late": 2,
      "absent": 1
    }
  }
}
```

---

## Attendance Status Values

| Status | Description |
|--------|-------------|
| `present` | Employee was on time |
| `late` | Check-in was more than 15 min after scheduled start |
| `absent` | No attendance recorded |
| `half_day` | Worked less than 4 hours |
| `on_leave` | Approved leave |
| `holiday` | Public holiday |

---

## Environment Variables

See `.env.example` for full reference.

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development`, `test`, `staging`, `production` |
| `PORT` | `3000` | HTTP server port |
| `DB_CLIENT` | `sqlite3` | `sqlite3` or `pg` |
| `JWT_SECRET` | *(required)* | JWT signing secret — **change in production** |
| `LOG_LEVEL` | `info` | `error`, `warn`, `info`, `http`, `debug` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

---

## Running Tests

```bash
npm test                  # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:coverage     # Coverage report
```

---

## Database Migrations

```bash
npm run migrate           # Run pending migrations
npm run migrate:rollback  # Rollback last batch
npm run migrate:make name # Create a new migration file
```

---

## Security Considerations

- JWT tokens expire after 24 hours (configurable)
- All inputs validated and sanitized with Joi
- SQL injection prevented via Knex parameterized queries
- Helmet sets security-related HTTP headers
- Rate limiting applied to all `/api/` routes
- Passwords hashed with bcrypt (users table)
- Production images run as non-root user
- Sensitive config via environment variables only
