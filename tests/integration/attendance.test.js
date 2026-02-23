'use strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../../src/app');

const knex = require('knex');
const knexConfigs = require('../../src/config/knexfile');
const testDb = knex(knexConfigs.test);

jest.mock('../../src/db', () => ({
  db: testDb,
  connectDatabase: jest.fn().mockResolvedValue(),
  disconnectDatabase: jest.fn().mockResolvedValue(),
}));

const EMP_URL = '/api/v1/employees';
const ATT_URL = '/api/v1/attendance';

const validEmployee = {
  employee_code: 'EMP001',
  first_name: 'Alice',
  last_name: 'Johnson',
  email: 'alice@example.com',
  status: 'active',
  expected_check_in: '09:00:00',
  expected_check_out: '18:00:00',
};

let employeeId;

beforeAll(async () => {
  await testDb.migrate.latest({ directory: './src/db/migrations' });
});

afterAll(async () => {
  await testDb.migrate.rollback({ all: true, directory: './src/db/migrations' });
  await testDb.destroy();
});

beforeEach(async () => {
  await testDb('attendance_records').del();
  await testDb('employees').del();

  const res = await request(app).post(EMP_URL).send(validEmployee);
  employeeId = res.body.data.id;
});

describe('POST /attendance/check-in', () => {
  it('records a check-in for an active employee', async () => {
    const res = await request(app)
      .post(`${ATT_URL}/check-in`)
      .send({ employeeId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employee_id).toBe(employeeId);
    expect(res.body.data.check_in).toBeDefined();
    expect(res.body.data.check_out).toBeNull();
    expect(['present', 'late']).toContain(res.body.data.status);
  });

  it('returns 409 on duplicate check-in for today', async () => {
    await request(app).post(`${ATT_URL}/check-in`).send({ employeeId });
    const res = await request(app).post(`${ATT_URL}/check-in`).send({ employeeId });
    expect(res.status).toBe(409);
  });

  it('returns 404 for unknown employee', async () => {
    const res = await request(app)
      .post(`${ATT_URL}/check-in`)
      .send({ employeeId: '00000000-0000-4000-a000-000000000000' });
    expect(res.status).toBe(404);
  });

  it('returns 422 when employeeId is missing', async () => {
    const res = await request(app).post(`${ATT_URL}/check-in`).send({});
    expect(res.status).toBe(422);
  });
});

describe('POST /attendance/check-out', () => {
  it('records check-out and computes work_hours', async () => {
    await request(app).post(`${ATT_URL}/check-in`).send({ employeeId });

    const res = await request(app)
      .post(`${ATT_URL}/check-out`)
      .send({ employeeId });

    expect(res.status).toBe(200);
    expect(res.body.data.check_out).toBeDefined();
    expect(typeof res.body.data.work_hours).toBe('number');
  });

  it('returns 400 when no open check-in exists', async () => {
    const res = await request(app)
      .post(`${ATT_URL}/check-out`)
      .send({ employeeId });
    expect(res.status).toBe(400);
  });
});

describe('GET /attendance', () => {
  beforeEach(async () => {
    await request(app).post(`${ATT_URL}/check-in`).send({ employeeId });
  });

  it('returns paginated attendance records', async () => {
    const res = await request(app).get(ATT_URL);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.pagination.total).toBe(1);
  });

  it('filters by employeeId', async () => {
    const res = await request(app).get(`${ATT_URL}?employeeId=${employeeId}`);
    expect(res.status).toBe(200);
    expect(res.body.data[0].employee_id).toBe(employeeId);
  });
});

describe('GET /attendance/reports/summary', () => {
  it('returns summary stats after check-in and check-out', async () => {
    await request(app).post(`${ATT_URL}/check-in`).send({ employeeId });
    await request(app).post(`${ATT_URL}/check-out`).send({ employeeId });

    const res = await request(app).get(`${ATT_URL}/reports/summary`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /attendance/:id', () => {
  it('returns a specific attendance record', async () => {
    const checkInRes = await request(app).post(`${ATT_URL}/check-in`).send({ employeeId });
    const id = checkInRes.body.data.id;

    const res = await request(app).get(`${ATT_URL}/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get(`${ATT_URL}/00000000-0000-4000-a000-000000000000`);
    expect(res.status).toBe(404);
  });
});
