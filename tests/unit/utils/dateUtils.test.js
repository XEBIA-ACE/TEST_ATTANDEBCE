const {
  startOfDay,
  endOfDay,
  calculateWorkedHours,
  formatDuration,
  getDateRange,
  isWeekend,
} = require('../../../src/business/utils/dateUtils');

describe('dateUtils', () => {
  describe('startOfDay', () => {
    it('returns UTC midnight for the given date', () => {
      const result = startOfDay(new Date('2024-06-15T14:30:00Z'));
      expect(result).toBe('2024-06-15T00:00:00.000Z');
    });

    it('defaults to today when no date is provided', () => {
      const result = startOfDay();
      expect(result).toMatch(/T00:00:00\.000Z$/);
    });
  });

  describe('endOfDay', () => {
    it('returns UTC 23:59:59.999 for the given date', () => {
      const result = endOfDay(new Date('2024-06-15T14:30:00Z'));
      expect(result).toBe('2024-06-15T23:59:59.999Z');
    });
  });

  describe('calculateWorkedHours', () => {
    it('calculates hours between two timestamps', () => {
      const checkIn = '2024-06-15T09:00:00Z';
      const checkOut = '2024-06-15T17:30:00Z';
      expect(calculateWorkedHours(checkIn, checkOut)).toBe(8.5);
    });

    it('returns null when checkIn is missing', () => {
      expect(calculateWorkedHours(null, '2024-06-15T17:00:00Z')).toBeNull();
    });

    it('returns null when checkOut is missing', () => {
      expect(calculateWorkedHours('2024-06-15T09:00:00Z', null)).toBeNull();
    });

    it('returns null when checkOut is before checkIn', () => {
      expect(calculateWorkedHours('2024-06-15T17:00:00Z', '2024-06-15T09:00:00Z')).toBeNull();
    });

    it('rounds to 2 decimal places', () => {
      const checkIn = '2024-06-15T09:00:00Z';
      const checkOut = '2024-06-15T09:10:00Z'; // 10 minutes = 0.17 hours
      expect(calculateWorkedHours(checkIn, checkOut)).toBe(0.17);
    });
  });

  describe('formatDuration', () => {
    it('formats milliseconds into hours and minutes', () => {
      const ms = (8 * 60 + 30) * 60 * 1000; // 8h 30m
      expect(formatDuration(ms)).toBe('8h 30m');
    });

    it('returns "0h 0m" for null input', () => {
      expect(formatDuration(null)).toBe('0h 0m');
    });

    it('returns "0h 0m" for negative input', () => {
      expect(formatDuration(-1000)).toBe('0h 0m');
    });
  });

  describe('getDateRange', () => {
    it('returns an array of date strings', () => {
      const result = getDateRange('2024-06-10', '2024-06-12');
      expect(result).toEqual(['2024-06-10', '2024-06-11', '2024-06-12']);
    });

    it('returns a single date when start equals end', () => {
      const result = getDateRange('2024-06-15', '2024-06-15');
      expect(result).toEqual(['2024-06-15']);
    });
  });

  describe('isWeekend', () => {
    it('returns true for Saturday', () => {
      expect(isWeekend('2024-06-15')).toBe(true); // Saturday
    });

    it('returns true for Sunday', () => {
      expect(isWeekend('2024-06-16')).toBe(true); // Sunday
    });

    it('returns false for a weekday', () => {
      expect(isWeekend('2024-06-17')).toBe(false); // Monday
    });
  });
});
