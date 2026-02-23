'use strict';

const attendanceService = require('../../../src/services/attendanceService');
const attendanceRepository = require('../../../src/repositories/attendanceRepository');
const employeeRepository = require('../../../src/repositories/employeeRepository');
const { NotFoundError, ConflictError, BadRequestError } = require('../../../src/utils/errors');

jest.mock('../../../src/repositories/attendanceRepository');
jest.mock('../../../src/repositories/employeeRepository');

const mockEmployee = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  employee_code: 'EMP001',
  first_name: 'Alice',
  last_name: 'Johnson',
  email: 'alice@example.com',
  status: 'active',
  expected_check_in: '09:00:00',
  expected_check_out: '18:00:00',
};

const today = new Date().toISOString().split('T')[0];

const mockRecord = {
  id: 'rrrrrrrr-ssss-tttt-uuuu-vvvvvvvvvvvv',
  employee_id: mockEmployee.id,
  date: today,
  check_in: new Date().toISOString(),
  check_out: null,
  status: 'present',
  work_hours: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('attendanceService.checkIn', () => {
  it('creates a check-in record for an active employee with no existing record today', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);
    attendanceRepository.create.mockResolvedValue(mockRecord);

    const result = await attendanceService.checkIn({ employeeId: mockEmployee.id });
    expect(result).toEqual(mockRecord);
    expect(attendanceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ employee_id: mockEmployee.id, date: today })
    );
  });

  it('throws NotFoundError when employee does not exist', async () => {
    employeeRepository.findById.mockResolvedValue(null);
    await expect(attendanceService.checkIn({ employeeId: 'bad-id' })).rejects.toThrow(NotFoundError);
  });

  it('throws BadRequestError when employee is not active', async () => {
    employeeRepository.findById.mockResolvedValue({ ...mockEmployee, status: 'inactive' });
    await expect(attendanceService.checkIn({ employeeId: mockEmployee.id })).rejects.toThrow(
      BadRequestError
    );
  });

  it('throws ConflictError when a record for today already exists', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    attendanceRepository.findByEmployeeAndDate.mockResolvedValue(mockRecord);
    await expect(attendanceService.checkIn({ employeeId: mockEmployee.id })).rejects.toThrow(
      ConflictError
    );
  });
});

describe('attendanceService.checkOut', () => {
  it('updates the open record with check-out time and work hours', async () => {
    const checkInTime = new Date(Date.now() - 8 * 60 * 60 * 1000); // 8 hours ago
    const openRecord = { ...mockRecord, check_in: checkInTime };

    employeeRepository.findById.mockResolvedValue(mockEmployee);
    attendanceRepository.findOpenRecord.mockResolvedValue(openRecord);
    attendanceRepository.update.mockResolvedValue({
      ...openRecord,
      check_out: new Date(),
      work_hours: 8,
    });

    const result = await attendanceService.checkOut({ employeeId: mockEmployee.id });
    expect(result.work_hours).toBeGreaterThan(0);
    expect(attendanceRepository.update).toHaveBeenCalledWith(
      openRecord.id,
      expect.objectContaining({ work_hours: expect.any(Number) })
    );
  });

  it('throws NotFoundError when employee does not exist', async () => {
    employeeRepository.findById.mockResolvedValue(null);
    await expect(attendanceService.checkOut({ employeeId: 'bad-id' })).rejects.toThrow(NotFoundError);
  });

  it('throws BadRequestError when no open check-in exists', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    attendanceRepository.findOpenRecord.mockResolvedValue(null);
    await expect(attendanceService.checkOut({ employeeId: mockEmployee.id })).rejects.toThrow(
      BadRequestError
    );
  });
});

describe('attendanceService.getRecordById', () => {
  it('returns record when found', async () => {
    attendanceRepository.findById.mockResolvedValue(mockRecord);
    const result = await attendanceService.getRecordById(mockRecord.id);
    expect(result).toEqual(mockRecord);
  });

  it('throws NotFoundError when record does not exist', async () => {
    attendanceRepository.findById.mockResolvedValue(null);
    await expect(attendanceService.getRecordById('bad-id')).rejects.toThrow(NotFoundError);
  });
});
