jest.mock('../../../src/data/repositories/attendanceRepository');
jest.mock('../../../src/data/repositories/employeeRepository');

const attendanceService = require('../../../src/business/services/attendanceService');
const attendanceRepository = require('../../../src/data/repositories/attendanceRepository');
const employeeRepository = require('../../../src/data/repositories/employeeRepository');

const mockEmployee = {
  id: 'emp-uuid-1',
  firstName: 'Bob',
  lastName: 'Jones',
  email: 'bob@example.com',
  department: 'Engineering',
  isActive: true,
};

const mockRecord = {
  id: 'rec-uuid-1',
  employeeId: 'emp-uuid-1',
  firstName: 'Bob',
  lastName: 'Jones',
  department: 'Engineering',
  checkInTime: new Date().toISOString(),
  checkOutTime: null,
  workedHours: null,
  status: 'checked_in',
  checkInNotes: null,
  checkOutNotes: null,
  checkInLocation: null,
  checkOutLocation: null,
};

beforeEach(() => jest.clearAllMocks());

// ─── checkIn ─────────────────────────────────────────────────────────────────
describe('checkIn', () => {
  it('creates a check-in record for an active employee', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    attendanceRepository.findOpenRecord.mockResolvedValue(null);
    attendanceRepository.create.mockResolvedValue(mockRecord);

    const result = await attendanceService.checkIn({ employeeId: 'emp-uuid-1' });
    expect(result).toEqual(mockRecord);
    expect(attendanceRepository.create).toHaveBeenCalledTimes(1);
  });

  it('throws 404 when employee does not exist', async () => {
    employeeRepository.findById.mockResolvedValue(null);
    await expect(attendanceService.checkIn({ employeeId: 'unknown' })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 for inactive employees', async () => {
    employeeRepository.findById.mockResolvedValue({ ...mockEmployee, isActive: false });
    await expect(attendanceService.checkIn({ employeeId: 'emp-uuid-1' })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 400 when employee has already checked in today', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    attendanceRepository.findOpenRecord.mockResolvedValue(mockRecord);
    await expect(attendanceService.checkIn({ employeeId: 'emp-uuid-1' })).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── checkOut ────────────────────────────────────────────────────────────────
describe('checkOut', () => {
  it('records check-out and calculates worked hours', async () => {
    const checkedOutRecord = {
      ...mockRecord,
      checkOutTime: new Date().toISOString(),
      workedHours: 8.0,
      status: 'checked_out',
    };

    attendanceRepository.findById.mockResolvedValue(mockRecord);
    attendanceRepository.update.mockResolvedValue(checkedOutRecord);

    const result = await attendanceService.checkOut('rec-uuid-1', {});
    expect(result.status).toBe('checked_out');
    expect(attendanceRepository.update).toHaveBeenCalledTimes(1);
  });

  it('throws 404 when record not found', async () => {
    attendanceRepository.findById.mockResolvedValue(null);
    await expect(attendanceService.checkOut('unknown', {})).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 400 when already checked out', async () => {
    attendanceRepository.findById.mockResolvedValue({ ...mockRecord, status: 'checked_out' });
    await expect(attendanceService.checkOut('rec-uuid-1', {})).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─── getRecordById ───────────────────────────────────────────────────────────
describe('getRecordById', () => {
  it('returns a record when found', async () => {
    attendanceRepository.findById.mockResolvedValue(mockRecord);
    const result = await attendanceService.getRecordById('rec-uuid-1');
    expect(result).toEqual(mockRecord);
  });

  it('throws 404 when record not found', async () => {
    attendanceRepository.findById.mockResolvedValue(null);
    await expect(attendanceService.getRecordById('unknown')).rejects.toMatchObject({ statusCode: 404 });
  });
});
