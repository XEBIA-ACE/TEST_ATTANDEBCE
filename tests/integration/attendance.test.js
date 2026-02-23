const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const attendanceService = require('../../src/domain/services/attendanceService');
const Attendance = require('../../src/domain/models/Attendance');

jest.mock('../../src/domain/services/attendanceService');

const authToken = jwt.sign(
  { id: 'test-user', role: 'admin' },
  process.env.JWT_SECRET || 'test-secret-key',
  { expiresIn: '1h' }
);

const today = new Date().toISOString().split('T')[0];
const empId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const recId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

const mockRecord = Attendance.fromDB({
  id: recId,
  employee_id: empId,
  date: today,
  check_in: new Date(),
  check_out: null,
  status: 'present',
  notes: null,
  created_at: new Date(),
  updated_at: new Date(),
});

describe('POST /api/v1/attendance/check-in/:employeeId', () => {
  it('records a check-in and returns 201', async () => {
    attendanceService.checkIn.mockResolvedValue(mockRecord);

    const res = await request(app)
      .post(`/api/v1/attendance/check-in/${empId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employee_id).toBe(empId);
  });

  it('returns 409 when employee already checked in', async () => {
    const err = new Error('Employee has already checked in today');
    err.statusCode = 409;
    attendanceService.checkIn.mockRejectedValue(err);

    const res = await request(app)
      .post(`/api/v1/attendance/check-in/${empId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/attendance/check-out/:employeeId', () => {
  it('records a check-out and returns 200', async () => {
    const checkedOut = Attendance.fromDB({
      ...mockRecord,
      check_out: new Date(),
    });
    attendanceService.checkOut.mockResolvedValue(checkedOut);

    const res = await request(app)
      .post(`/api/v1/attendance/check-out/${empId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.check_out).not.toBeNull();
  });

  it('returns 422 when no active check-in exists', async () => {
    const err = new Error('No active check-in found for today');
    err.statusCode = 422;
    attendanceService.checkOut.mockRejectedValue(err);

    const res = await request(app)
      .post(`/api/v1/attendance/check-out/${empId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(res.status).toBe(422);
  });
});

describe('GET /api/v1/attendance', () => {
  it('returns paginated records with 200', async () => {
    attendanceService.getAllRecords.mockResolvedValue({
      data: [mockRecord],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const res = await request(app)
      .get('/api/v1/attendance')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
