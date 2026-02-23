const attendanceService = require('../../../src/domain/services/attendanceService');
const attendanceRepository = require('../../../src/infrastructure/repositories/attendanceRepository');
const employeeRepository = require('../../../src/infrastructure/repositories/employeeRepository');
const Attendance = require('../../../src/domain/models/Attendance');
const Employee = require('../../../src/domain/models/Employee');

jest.mock('../../../src/infrastructure/repositories/attendanceRepository');
jest.mock('../../../src/infrastructure/repositories/employeeRepository');

const mockEmployee = Employee.fromDB({
  id: 'emp-uuid-1234',
  employee_code: 'EMP-0001',
  first_name: 'Alice',
  last_name: 'Smith',
  email: 'alice@example.com',
  department: 'Engineering',
  position: 'Engineer',
  status: 'active',
  hire_date: '2022-01-01',
  created_at: new Date(),
  updated_at: new Date(),
});

const today = new Date().toISOString().split('T')[0];

const mockAttendance = Attendance.fromDB({
  id: 'att-uuid-1234',
  employee_id: 'emp-uuid-1234',
  date: today,
  check_in: new Date(),
  check_out: null,
  status: 'present',
  notes: null,
  created_at: new Date(),
  updated_at: new Date(),
});

describe('AttendanceService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('checkIn', () => {
    it('creates a check-in for an active employee', async () => {
      employeeRepository.findById.mockResolvedValue(mockEmployee);
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(null);
      attendanceRepository.create.mockResolvedValue(mockAttendance);

      const result = await attendanceService.checkIn(mockEmployee.id);

      expect(attendanceRepository.create).toHaveBeenCalledTimes(1);
      const createArg = attendanceRepository.create.mock.calls[0][0];
      expect(createArg.employee_id).toBe(mockEmployee.id);
      expect(createArg.date).toBe(today);
      expect(result).toBeInstanceOf(Attendance);
    });

    it('throws 409 when employee has already checked in today', async () => {
      employeeRepository.findById.mockResolvedValue(mockEmployee);
      attendanceRepository.findByEmployeeAndDate.mockResolvedValue(mockAttendance);

      await expect(attendanceService.checkIn(mockEmployee.id)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('throws 422 when employee is inactive', async () => {
      const inactiveEmployee = Employee.fromDB({ ...mockEmployee, status: 'inactive' });
      employeeRepository.findById.mockResolvedValue(inactiveEmployee);

      await expect(attendanceService.checkIn(inactiveEmployee.id)).rejects.toMatchObject({
        statusCode: 422,
      });
    });

    it('throws 404 when employee does not exist', async () => {
      employeeRepository.findById.mockResolvedValue(null);

      await expect(attendanceService.checkIn('ghost-id')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('checkOut', () => {
    it('records a check-out against an active session', async () => {
      const updatedRecord = Attendance.fromDB({
        ...mockAttendance,
        check_out: new Date(),
        status: 'present',
      });
      attendanceRepository.findActiveCheckIn.mockResolvedValue(mockAttendance);
      attendanceRepository.update.mockResolvedValue(updatedRecord);

      const result = await attendanceService.checkOut(mockEmployee.id);

      expect(attendanceRepository.update).toHaveBeenCalledWith(
        mockAttendance.id,
        expect.objectContaining({ check_out: expect.any(Date) })
      );
      expect(result.isCheckedOut).toBe(true);
    });

    it('throws 422 when no active check-in exists', async () => {
      attendanceRepository.findActiveCheckIn.mockResolvedValue(null);

      await expect(attendanceService.checkOut(mockEmployee.id)).rejects.toMatchObject({
        statusCode: 422,
      });
    });
  });

  describe('_deriveStatus', () => {
    it('marks on-time arrivals as present', () => {
      const onTime = new Date();
      onTime.setHours(8, 55, 0, 0); // before 09:15 threshold
      expect(attendanceService._deriveStatus(onTime)).toBe('present');
    });

    it('marks late arrivals as late', () => {
      const late = new Date();
      late.setHours(9, 30, 0, 0); // well past the 09:15 threshold
      expect(attendanceService._deriveStatus(late)).toBe('late');
    });
  });
});
