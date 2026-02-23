const attendanceService = require('../../../src/services/attendance.service');
const attendanceRepository = require('../../../src/repositories/attendance.repository');
const employeeRepository = require('../../../src/repositories/employee.repository');
const { NotFoundError, ConflictError, BadRequestError } = require('../../../src/utils/errors');

jest.mock('../../../src/repositories/attendance.repository');
jest.mock('../../../src/repositories/employee.repository');

const activeEmployee = {
  id: 'emp-1',
  isActive: true,
  toJSON() { return this; },
};

const buildRecord = (overrides = {}) => ({
  id: 'rec-1',
  employeeId: 'emp-1',
  date: '2024-01-15',
  clockIn: new Date('2024-01-15T09:00:00Z'),
  clockOut: null,
  breakStart: null,
  breakEnd: null,
  breakDurationMinutes: 0,
  status: 'present',
  toJSON() { return this; },
  ...overrides,
});

describe('AttendanceService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('clockIn', () => {
    it('creates a clock-in record', async () => {
      employeeRepository.findById.mockResolvedValue(activeEmployee);
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);
      attendanceRepository.findActiveClockIn.mockResolvedValue(null);
      attendanceRepository.create.mockResolvedValue(buildRecord());

      const result = await attendanceService.clockIn('emp-1', { date: '2024-01-15' });
      expect(result.employeeId).toBe('emp-1');
      expect(attendanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId: 'emp-1', date: '2024-01-15' }),
      );
    });

    it('throws NotFoundError for unknown employee', async () => {
      employeeRepository.findById.mockResolvedValue(null);
      await expect(attendanceService.clockIn('bad-id')).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError when record for date exists', async () => {
      employeeRepository.findById.mockResolvedValue(activeEmployee);
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(buildRecord());
      await expect(
        attendanceService.clockIn('emp-1', { date: '2024-01-15' }),
      ).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError when open session exists', async () => {
      employeeRepository.findById.mockResolvedValue(activeEmployee);
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);
      attendanceRepository.findActiveClockIn.mockResolvedValue(buildRecord());
      await expect(
        attendanceService.clockIn('emp-1', { date: '2024-01-16' }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('clockOut', () => {
    it('records clock-out on open session', async () => {
      const openSession = buildRecord({ clockIn: new Date(Date.now() - 3600000) });
      attendanceRepository.findActiveClockIn.mockResolvedValue(openSession);
      const closed = buildRecord({ clockOut: new Date() });
      attendanceRepository.update.mockResolvedValue(closed);

      const result = await attendanceService.clockOut('emp-1');
      expect(attendanceRepository.update).toHaveBeenCalledWith(
        'rec-1',
        expect.objectContaining({ clockOut: expect.any(Date) }),
      );
      expect(result.clockOut).toBeTruthy();
    });

    it('throws BadRequestError when no open session', async () => {
      attendanceRepository.findActiveClockIn.mockResolvedValue(null);
      await expect(attendanceService.clockOut('emp-1')).rejects.toThrow(BadRequestError);
    });
  });

  describe('deleteRecord', () => {
    it('deletes successfully', async () => {
      attendanceRepository.delete.mockResolvedValue(true);
      await expect(attendanceService.deleteRecord('rec-1')).resolves.toBeUndefined();
    });

    it('throws NotFoundError when record missing', async () => {
      attendanceRepository.delete.mockResolvedValue(false);
      await expect(attendanceService.deleteRecord('bad-id')).rejects.toThrow(NotFoundError);
    });
  });
});
