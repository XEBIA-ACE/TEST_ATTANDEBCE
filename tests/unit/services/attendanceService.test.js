'use strict';

// Mock repositories before requiring the service
jest.mock('../../../src/repositories/attendanceRepository');
jest.mock('../../../src/repositories/employeeRepository');

const attendanceService = require('../../../src/services/attendanceService');
const attendanceRepository = require('../../../src/repositories/attendanceRepository');
const employeeRepository = require('../../../src/repositories/employeeRepository');
const { NotFoundError, ConflictError, BadRequestError } = require('../../../src/utils/errors');

const mockEmployee = {
  id: 'emp-uuid-1',
  employee_code: 'EMP-001',
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  status: 'active',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AttendanceService.checkIn', () => {
  it('creates a new attendance record on first check-in of the day', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);
    const created = { id: 'rec-1', employee_id: mockEmployee.id, status: 'present' };
    attendanceRepository.create.mockResolvedValue(created);

    const result = await attendanceService.checkIn(mockEmployee.id, {
      checkInTime: new Date('2024-01-15T08:00:00Z'),
    });

    expect(attendanceRepository.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual(created);
  });

  it('throws NotFoundError when employee does not exist', async () => {
    employeeRepository.findById.mockResolvedValue(null);

    await expect(attendanceService.checkIn('unknown-id')).rejects.toThrow(NotFoundError);
    expect(attendanceRepository.create).not.toHaveBeenCalled();
  });

  it('throws ConflictError when already checked in today', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    attendanceRepository.findByEmployeeAndDate.mockResolvedValue({
      id: 'rec-existing',
      check_in_time: new Date('2024-01-15T07:50:00Z'),
    });

    await expect(
      attendanceService.checkIn(mockEmployee.id, { checkInTime: new Date('2024-01-15T09:00:00Z') })
    ).rejects.toThrow(ConflictError);
  });

  it('throws BadRequestError for inactive employee', async () => {
    employeeRepository.findById.mockResolvedValue({ ...mockEmployee, status: 'inactive' });

    await expect(attendanceService.checkIn(mockEmployee.id)).rejects.toThrow(BadRequestError);
  });

  it('flags check-in after 09:15 UTC as late', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);
    attendanceRepository.create.mockImplementation((data) => Promise.resolve(data));

    await attendanceService.checkIn(mockEmployee.id, {
      checkInTime: new Date('2024-01-15T09:30:00Z'),
    });

    const createCall = attendanceRepository.create.mock.calls[0][0];
    expect(createCall.status).toBe('late');
  });
});

describe('AttendanceService.checkOut', () => {
  it('records check-out and calculates work hours', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    const existing = {
      id: 'rec-1',
      employee_id: mockEmployee.id,
      check_in_time: new Date('2024-01-15T08:00:00Z'),
      check_out_time: null,
    };
    attendanceRepository.findByEmployeeAndDate.mockResolvedValue(existing);
    attendanceRepository.update.mockImplementation((id, data) => Promise.resolve({ id, ...data }));

    const result = await attendanceService.checkOut(mockEmployee.id, {
      checkOutTime: new Date('2024-01-15T16:30:00Z'),
    });

    expect(attendanceRepository.update).toHaveBeenCalledTimes(1);
    const updateArgs = attendanceRepository.update.mock.calls[0][1];
    expect(updateArgs.work_hours).toBe(8.5);
  });

  it('throws BadRequestError when no check-in exists for today', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);

    await expect(attendanceService.checkOut(mockEmployee.id)).rejects.toThrow(BadRequestError);
  });

  it('throws ConflictError when already checked out', async () => {
    employeeRepository.findById.mockResolvedValue(mockEmployee);
    attendanceRepository.findByEmployeeAndDate.mockResolvedValue({
      id: 'rec-1',
      check_in_time: new Date('2024-01-15T08:00:00Z'),
      check_out_time: new Date('2024-01-15T16:00:00Z'),
    });

    await expect(attendanceService.checkOut(mockEmployee.id)).rejects.toThrow(ConflictError);
  });
});

describe('AttendanceService.getRecord', () => {
  it('returns a record by id', async () => {
    const record = { id: 'rec-1', employee_id: mockEmployee.id };
    attendanceRepository.findById.mockResolvedValue(record);

    const result = await attendanceService.getRecord('rec-1');
    expect(result).toEqual(record);
  });

  it('throws NotFoundError when record does not exist', async () => {
    attendanceRepository.findById.mockResolvedValue(null);
    await expect(attendanceService.getRecord('nonexistent')).rejects.toThrow(NotFoundError);
  });
});
