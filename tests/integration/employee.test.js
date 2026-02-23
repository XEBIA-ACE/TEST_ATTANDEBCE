/**
 * Integration tests for the Employee API.
 *
 * These tests run against a real test database.
 * Set DB_NAME_TEST in your .env before running, or use:
 *   NODE_ENV=test npm run test:integration
 *
 * The database must be migrated before running:
 *   NODE_ENV=test npm run migrate
 */
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/database');

// Skip integration tests if no real DB is available
const describeIfDb = process.env.INTEGRATION_TEST === 'true' ? describe : describe.skip;

describeIfDb('Employee API Integration', () => {
  let authToken;
  let createdEmployeeId;

  beforeAll(async () => {
    // Run migrations on the test database
    await db.migrate.latest();

    // Obtain a JWT token for authenticated requests
    // In a real setup, this would call an /auth/login endpoint
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { sub: 'test-user', role: 'admin' },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await db.migrate.rollback(null, true);
    await db.destroy();
  });

  describe('POST /api/v1/employees', () => {
    it('creates a new employee', async () => {
      const payload = {
        firstName: 'Test',
        lastName: 'User',
        email: `test.user.${Date.now()}@example.com`,
        department: 'Engineering',
        position: 'Developer',
        hireDate: '2023-01-01',
      };

      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.data.employee.email).toBe(payload.email);
      createdEmployeeId = res.body.data.employee.id;
    });

    it('returns 422 for missing required fields', async () => {
      await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Incomplete' })
        .expect(422);
    });

    it('returns 409 for duplicate email', async () => {
      const email = `dupe.${Date.now()}@example.com`;
      const payload = {
        firstName: 'First',
        lastName: 'User',
        email,
        department: 'HR',
        position: 'Specialist',
        hireDate: '2023-01-01',
      };

      await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(201);

      await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(409);
    });
  });

  describe('GET /api/v1/employees', () => {
    it('returns a paginated list', async () => {
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('employees');
      expect(res.body.data).toHaveProperty('pagination');
    });

    it('filters by department', async () => {
      const res = await request(app)
        .get('/api/v1/employees?department=Engineering')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.employees.every((e) => e.department === 'Engineering')).toBe(true);
    });
  });

  describe('GET /api/v1/employees/:id', () => {
    it('returns the employee', async () => {
      if (!createdEmployeeId) return;
      const res = await request(app)
        .get(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.employee.id).toBe(createdEmployeeId);
    });

    it('returns 404 for unknown id', async () => {
      await request(app)
        .get('/api/v1/employees/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/employees/:id', () => {
    it('updates the employee position', async () => {
      if (!createdEmployeeId) return;
      const res = await request(app)
        .put(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ position: 'Senior Developer' })
        .expect(200);

      expect(res.body.data.employee.position).toBe('Senior Developer');
    });
  });

  describe('DELETE /api/v1/employees/:id', () => {
    it('deactivates the employee', async () => {
      if (!createdEmployeeId) return;
      await request(app)
        .delete(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });
  });
});
