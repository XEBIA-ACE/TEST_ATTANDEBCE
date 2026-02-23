/**
 * Integration tests for the /api/v1/attendance endpoints.
 */
const request = require('supertest');

jest.mock('../../src/database/connection', () => ({
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    query: jest.fn().mockResolvedValue([]),
    close: jest.fn().mockResolvedValue(true),
  },
  connectDatabase: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/models', () => ({
  sequelize: { authenticate: jest.fn(), query: jest.fn() },
  Department: {},
  Employee: {},
  AttendanceRecord: {},
}));

jest.mock('../../src/services/attendance.service', () => ({
  listRecords: jest.fn(),
  getRecord: jest.fn(),
  clockIn: jest.fn(),
  clockOut: jest.fn(),
  startBreak: jest.fn(),
  endBreak: jest.fn(),
  createManualRecord: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
  getSummary: jest.fn(),
}));

const app = require('../../src/app');
const attendanceService = require('../../src/services/attendance.service');
const { NotFoundError, ConflictError, BadRequestError } = require('../../src/utils/errors');

const EMP_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const REC_ID = 'a84bc20c-69dd-5483-b678-1f13c3d4e580';

const sampleRecord = {
  id: REC_ID,
  employeeId: EMP_ID,
  date: '2024-01-15',
  clockIn: '2024-01-15T09:00:00.000Z',
  clockOut: null,
  status: 'present',
  totalHours: null,
};

describe('Attendance API', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/v1/attendance', () => {
    it('returns paginated records', async () => {
      attendanceService.listRecords.mockResolvedValue({ count: 1, records: [sampleRecord] });
      const res = await request(app).get('/api/v1/attendance');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('GET /api/v1/attendance/summary', () => {
    it('returns aggregated stats', async () => {
      attendanceService.getSummary.mockResolvedValue({
        totalDays: 10,
        totalHours: 80.5,
        overtimeHours: 0.5,
        statusCounts: { present: 10 },
      });
      const res = await request(app).get('/api/v1/attendance/summary');
      expect(res.status).toBe(200);
      expect(res.body.data.totalDays).toBe(10);
    });
  });

  describe('POST /api/v1/attendance/clock-in', () => {
    it('records clock-in and returns 201', async () => {
      attendanceService.clockIn.mockResolvedValue(sampleRecord);
      const res = await request(app)
        .post('/api/v1/attendance/clock-in')
        .send({ employeeId: EMP_ID });
      expect(res.status).toBe(201);
      expect(res.body.data.employeeId).toBe(EMP_ID);
    });

    it('returns 409 when already clocked in', async () => {
      attendanceService.clockIn.mockRejectedValue(new ConflictError('Already clocked in'));
      const res = await request(app)
        .post('/api/v1/attendance/clock-in')
        .send({ employeeId: EMP_ID });
      expect(res.status).toBe(409);
    });

    it('returns 422 for missing employeeId', async () => {
      const res = await request(app).post('/api/v1/attendance/clock-in').send({});
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/attendance/clock-out', () => {
    it('records clock-out', async () => {
      const closed = { ...sampleRecord, clockOut: '2024-01-15T17:00:00.000Z', totalHours: 8.0 };
      attendanceService.clockOut.mockResolvedValue(closed);
      const res = await request(app)
        .post('/api/v1/attendance/clock-out')
        .send({ employeeId: EMP_ID });
      expect(res.status).toBe(200);
      expect(res.body.data.totalHours).toBe(8.0);
    });

    it('returns 400 when no open session', async () => {
      attendanceService.clockOut.mockRejectedValue(
        new BadRequestError('No open clock-in session'),
      );
      const res = await request(app)
        .post('/api/v1/attendance/clock-out')
        .send({ employeeId: EMP_ID });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/attendance/:id', () => {
    it('returns the record', async () => {
      attendanceService.getRecord.mockResolvedValue(sampleRecord);
      const res = await request(app).get(`/api/v1/attendance/${REC_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(REC_ID);
    });

    it('returns 404 when not found', async () => {
      attendanceService.getRecord.mockRejectedValue(new NotFoundError('Attendance record'));
      const res = await request(app).get('/api/v1/attendance/bad-id');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/attendance/:id', () => {
    it('returns 204 on success', async () => {
      attendanceService.deleteRecord.mockResolvedValue();
      const res = await request(app).delete(`/api/v1/attendance/${REC_ID}`);
      expect(res.status).toBe(204);
    });
  });
});
