'use strict';

const request = require('supertest');
const app = require('../../src/app');
const attendanceRepository = require('../../src/repositories/attendance.repository');
const employeeRepository = require('../../src/repositories/employee.repository');

jest.mock('../../src/repositories/attendance.repository');
jest.mock('../../src/repositories/employee.repository');
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'test_secret_key_at_least_32_chars_long!!';

const adminToken = jwt.sign(
  { sub: 'user-1', email: 'admin@test.com', role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

const TODAY = new Date().toISOString().split('T')[0];

const makeDbEmployee = (overrides = {}) => ({
  id: 'emp-uuid-1',
  employee_code: 'EMP-001',
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  department: 'Engineering',
  is_active: true,
  isActive: true,
  ...overrides,
  toJSON() { return this; },
});

const makeDbRecord = (overrides = {}) => ({
  id: 'att-uuid-1',
  employee_id: 'emp-uuid-1',
  employeeId: 'emp-uuid-1',
  date: TODAY,
  check_in_time: new Date().toISOString(),
  checkInTime: new Date().toISOString(),
  check_out_time: null,
  checkOutTime: null,
  status: 'present',
  notes: null,
  total_hours: null,
  totalHours: null,
  isCheckedOut: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
  toJSON() { return this; },
});

describe('Attendance API', () => {
  afterEach(() => jest.clearAllMocks());

  // ── GET /api/v1/attendance ────────────────────────────────────────────────
  describe('GET /api/v1/attendance', () => {
    it('returns 200 with paginated records', async () => {
      attendanceRepository.findAll.mockResolvedValue({
        records: [makeDbRecord()],
        total: 1,
      });

      const res = await request(app)
        .get('/api/v1/attendance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records).toHaveLength(1);
    });

    it('returns 422 when date range is invalid', async () => {
      const res = await request(app)
        .get('/api/v1/attendance?start_date=2024-01-31&end_date=2024-01-01')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
    });
  });

  // ── POST /api/v1/attendance/check-in ──────────────────────────────────────
  describe('POST /api/v1/attendance/check-in', () => {
    it('records a check-in and returns 201', async () => {
      employeeRepository.findById.mockResolvedValue(makeDbEmployee());
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);
      attendanceRepository.create.mockResolvedValue(makeDbRecord());

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employee_id: 'emp-uuid-1' });

      expect(res.status).toBe(201);
      expect(res.body.data.employeeId).toBe('emp-uuid-1');
    });

    it('returns 422 when employee_id is missing', async () => {
      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(422);
    });

    it('returns 409 when already checked in today', async () => {
      employeeRepository.findById.mockResolvedValue(makeDbEmployee());
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(makeDbRecord());

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employee_id: 'emp-uuid-1' });

      expect(res.status).toBe(409);
    });
  });

  // ── PATCH /api/v1/attendance/:id/check-out ────────────────────────────────
  describe('PATCH /api/v1/attendance/:id/check-out', () => {
    it('records a check-out and returns 200', async () => {
      attendanceRepository.findById.mockResolvedValue(makeDbRecord());
      attendanceRepository.update.mockResolvedValue(
        makeDbRecord({ checkOutTime: new Date().toISOString(), isCheckedOut: true })
      );

      const res = await request(app)
        .patch('/api/v1/attendance/att-uuid-1/check-out')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(200);
    });

    it('returns 400 when already checked out', async () => {
      attendanceRepository.findById.mockResolvedValue(
        makeDbRecord({ checkOutTime: new Date().toISOString(), isCheckedOut: true })
      );

      const res = await request(app)
        .patch('/api/v1/attendance/att-uuid-1/check-out')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ── GET /api/v1/attendance/report ─────────────────────────────────────────
  describe('GET /api/v1/attendance/report', () => {
    it('returns 200 with summary report', async () => {
      attendanceRepository.getSummaryReport.mockResolvedValue([
        {
          employee_id: 'emp-uuid-1',
          employee_code: 'EMP-001',
          first_name: 'Jane',
          last_name: 'Doe',
          department: 'Engineering',
          total_days: '5',
          present_days: '4',
          absent_days: '1',
          late_days: '0',
          half_days: '0',
          total_hours: '32.00',
          avg_hours_per_day: '8.00',
        },
      ]);

      const res = await request(app)
        .get('/api/v1/attendance/report?start_date=2024-01-01&end_date=2024-01-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.results).toHaveLength(1);
    });

    it('returns 422 when start_date is missing', async () => {
      const res = await request(app)
        .get('/api/v1/attendance/report?end_date=2024-01-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
    });
  });
});
