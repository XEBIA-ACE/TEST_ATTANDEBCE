'use strict';

const Attendance = require('../../../src/domain/models/Attendance');

describe('Attendance Model', () => {
  const checkIn = new Date('2024-01-15T09:00:00Z');
  const checkOut = new Date('2024-01-15T17:30:00Z');

  const record = new Attendance({
    id: 'att-001',
    employee_id: 'emp-001',
    date: '2024-01-15',
    check_in: checkIn,
    check_out: checkOut,
    status: 'present',
    total_hours: null,
    notes: null,
  });

  describe('calculateTotalHours', () => {
    it('should compute hours between check-in and check-out', () => {
      const hours = record.calculateTotalHours();
      expect(hours).toBe(8.5);
    });

    it('should return null when check-in is missing', () => {
      const r = new Attendance({ ...record, check_in: null });
      expect(r.calculateTotalHours()).toBeNull();
    });

    it('should return null when check-out is missing', () => {
      const r = new Attendance({ ...record, check_out: null });
      expect(r.calculateTotalHours()).toBeNull();
    });
  });

  describe('hasCheckedOut', () => {
    it('should return true when check-out exists', () => {
      expect(record.hasCheckedOut()).toBe(true);
    });

    it('should return false when check-out is null', () => {
      const r = new Attendance({ ...record, check_out: null });
      expect(r.hasCheckedOut()).toBe(false);
    });
  });

  describe('STATUS constants', () => {
    it('should define all expected statuses', () => {
      expect(Attendance.ALLOWED_STATUSES).toEqual(
        expect.arrayContaining(['present', 'absent', 'late', 'half_day', 'on_leave'])
      );
    });
  });
});
