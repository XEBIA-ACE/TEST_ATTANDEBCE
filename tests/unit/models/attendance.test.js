const Attendance = require('../../../src/domain/models/Attendance');

describe('Attendance Model', () => {
  const baseData = {
    id: 'att-id',
    employee_id: 'emp-id',
    date: '2024-01-15',
    check_in: '2024-01-15T09:00:00.000Z',
    check_out: '2024-01-15T17:30:00.000Z',
    status: 'present',
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  describe('totalHours', () => {
    it('calculates total hours when checked out', () => {
      const record = Attendance.fromDB(baseData);
      expect(record.totalHours).toBeCloseTo(8.5, 1);
    });

    it('returns null when not yet checked out', () => {
      const record = Attendance.fromDB({ ...baseData, check_out: null });
      expect(record.totalHours).toBeNull();
    });
  });

  describe('isCheckedOut', () => {
    it('returns true when check_out is set', () => {
      const record = Attendance.fromDB(baseData);
      expect(record.isCheckedOut).toBe(true);
    });

    it('returns false when check_out is null', () => {
      const record = Attendance.fromDB({ ...baseData, check_out: null });
      expect(record.isCheckedOut).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('includes total_hours in the serialised output', () => {
      const record = Attendance.fromDB(baseData);
      const json = record.toJSON();
      expect(json).toHaveProperty('total_hours');
      expect(json.employee_id).toBe('emp-id');
    });
  });
});
