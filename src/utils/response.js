'use strict';

/**
 * Sends a standardised success response.
 *
 * @param {import('express').Response} res
 * @param {*}      data        - Payload to include under `data`
 * @param {string} message     - Human-readable description
 * @param {number} statusCode  - HTTP status (default 200)
 * @param {object} [meta]      - Optional metadata (pagination, etc.)
 */
function sendSuccess(res, data = null, message = 'Success', statusCode = 200, meta = null) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
}

/**
 * Sends a standardised error response.
 * Prefer using the errorHandler middleware instead of calling this directly.
 */
function sendError(res, message, statusCode = 500, code = 'ERROR', details = null) {
  const body = {
    success: false,
    error: { code, message },
  };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
}

/**
 * Builds a pagination metadata object from query params and total count.
 */
function buildPaginationMeta(page, limit, total) {
  return {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  };
}

module.exports = { sendSuccess, sendError, buildPaginationMeta };
