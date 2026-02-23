'use strict';

require('../../setup');

const ResponseHelper = require('../../../src/utils/response.helper');

// Create a minimal mock response object
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('ResponseHelper', () => {
  describe('success()', () => {
    it('sends 200 with success: true', () => {
      const res = mockRes();
      ResponseHelper.success(res, { message: 'OK', data: { id: 1 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: 'OK', data: { id: 1 } })
      );
    });
  });

  describe('created()', () => {
    it('sends 201 with success: true', () => {
      const res = mockRes();
      ResponseHelper.created(res, { message: 'Created' });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('error()', () => {
    it('sends the specified status code with success: false', () => {
      const res = mockRes();
      ResponseHelper.error(res, { statusCode: 404, message: 'Not found' });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: 'Not found' })
      );
    });
  });

  describe('paginationMeta()', () => {
    it('calculates totalPages correctly', () => {
      expect(ResponseHelper.paginationMeta(95, 1, 20)).toEqual({
        total: 95,
        page: 1,
        limit: 20,
        totalPages: 5,
      });
    });
  });
});
