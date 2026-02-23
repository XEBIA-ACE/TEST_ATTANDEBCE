const {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} = require('../../../src/utils/errors');

describe('custom error classes', () => {
  describe('AppError', () => {
    it('sets default status 500 and isOperational flag', () => {
      const err = new AppError('Something broke');
      expect(err.statusCode).toBe(500);
      expect(err.isOperational).toBe(true);
      expect(err instanceof Error).toBe(true);
    });
  });

  describe('NotFoundError', () => {
    it('returns 404 with resource name', () => {
      const err = new NotFoundError('Employee');
      expect(err.statusCode).toBe(404);
      expect(err.message).toContain('Employee');
      expect(err.code).toBe('NOT_FOUND');
    });

    it('uses default resource name when not supplied', () => {
      const err = new NotFoundError();
      expect(err.message).toBe('Resource not found');
    });
  });

  describe('ValidationError', () => {
    it('carries details', () => {
      const details = [{ field: 'email', message: 'Required' }];
      const err = new ValidationError('Validation failed', details);
      expect(err.statusCode).toBe(422);
      expect(err.details).toEqual(details);
    });
  });

  describe('ConflictError', () => {
    it('returns 409', () => {
      expect(new ConflictError('Duplicate').statusCode).toBe(409);
    });
  });

  describe('UnauthorizedError', () => {
    it('returns 401', () => {
      expect(new UnauthorizedError().statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('returns 403', () => {
      expect(new ForbiddenError().statusCode).toBe(403);
    });
  });

  describe('BadRequestError', () => {
    it('returns 400', () => {
      expect(new BadRequestError('Bad data').statusCode).toBe(400);
    });
  });
});
