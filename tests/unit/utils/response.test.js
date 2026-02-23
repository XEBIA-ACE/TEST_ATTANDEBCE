const { sendSuccess, sendCreated, sendError, sendNoContent, paginationMeta } = require('../../../src/utils/response');

describe('response utils', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('sendSuccess', () => {
    it('returns 200 with data', () => {
      const res = mockRes();
      sendSuccess(res, { id: '1' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: '1' } });
    });

    it('includes optional message and meta', () => {
      const res = mockRes();
      sendSuccess(res, [], { message: 'ok', meta: { total: 0 } });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'ok', meta: { total: 0 } }),
      );
    });
  });

  describe('sendCreated', () => {
    it('returns 201', () => {
      const res = mockRes();
      sendCreated(res, { id: '2' }, 'Created');
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('sendNoContent', () => {
    it('returns 204', () => {
      const res = mockRes();
      sendNoContent(res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('sendError', () => {
    it('returns error envelope', () => {
      const res = mockRes();
      sendError(res, { statusCode: 404, message: 'Not found', code: 'NOT_FOUND' });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Not found' },
      });
    });
  });

  describe('paginationMeta', () => {
    it('calculates totalPages correctly', () => {
      expect(paginationMeta({ count: 55, page: 2, limit: 10 })).toEqual({
        total: 55,
        page: 2,
        limit: 10,
        totalPages: 6,
      });
    });

    it('handles zero results', () => {
      expect(paginationMeta({ count: 0, page: 1, limit: 20 })).toMatchObject({ totalPages: 0 });
    });
  });
});
