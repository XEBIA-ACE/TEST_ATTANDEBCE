/**
 * Integration tests for the Attendance API.
 * Requires INTEGRATION_TEST=true and a running test database.
 */
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/config/database');

const describeIfDb = process.env.INTEGRATION_TEST === 'true' ? describe : describe.skip;

describeIfDb('Attendance API Integration', () => {
  let authToken;
  let employeeId;
  let recordId;

  beforeAll(async () => {
    await db.migrate.latest();

    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { sub: 'test-user', role: 'admin' },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // Create a test employee to use across tests
    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'Attendance',
        lastName: 'Tester',
        email: `att.test.${Date.now()}@example.com`,
        department: 'Engineering',
        position: 'QA Engineer',
        hireDate: '2023-01-01',
      });

    employeeId = res.body.data.employee.id;
  });

  afterAll(async () => {
    await db.migrate.rollback(null, true);
    await db.destroy();
  });

  describe('POST /api/v1/attendance/check-in', () => {
    it('records a check-in', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ employeeId })
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.data.record.status).toBe('checked_in');
      recordId = res.body.data.record.id;
    });

    it('prevents duplicate check-in on the same day', async () => {
      await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ employeeId })
        .expect(400);
    });
  });

  describe('PATCH /api/v1/attendance/:id/check-out', () => {
    it('records a check-out', async () => {
      if (!recordId) return;
      const res = await request(app)
        .patch(`/api/v1/attendance/${recordId}/check-out`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      expect(res.body.data.record.status).toBe('checked_out');
      expect(res.body.data.record.workedHours).toBeDefined();
    });

    it('prevents double check-out', async () => {
      if (!recordId) return;
      await request(app)
        .patch(`/api/v1/attendance/${recordId}/check-out`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/v1/attendance', () => {
    it('returns paginated records', async () => {
      const res = await request(app)
        .get('/api/v1/attendance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('records');
      expect(res.body.data).toHaveProperty('pagination');
    });
  });

  describe('GET /api/v1/attendance/employees/:employeeId', () => {
    it('returns records for a specific employee', async () => {
      const res = await request(app)
        .get(`/api/v1/attendance/employees/${employeeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.records.every((r) => r.employeeId === employeeId)).toBe(true);
    });
  });
});
