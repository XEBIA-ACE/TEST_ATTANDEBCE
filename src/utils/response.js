'use strict';

/**
 * Standardized API response helpers.
 * All endpoints use these to ensure a consistent response envelope.
 */

const success = (res, data = null, statusCode = 200, meta = null) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

const created = (res, data) => success(res, data, 201);

const paginated = (res, data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return success(res, data, 200, {
    pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  });
};

const noContent = (res) => res.status(204).send();

const error = (res, message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) => {
  const body = { success: false, error: { code, message } };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
};

module.exports = { success, created, paginated, noContent, error };
