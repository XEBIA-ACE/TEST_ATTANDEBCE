/**
 * Standardised JSON response helpers.
 *
 * All API responses share a consistent envelope:
 *   { success, data?, error?, meta?, message? }
 */

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {*} data - Payload to include under `data`
 * @param {object} [options]
 * @param {number}  [options.statusCode=200]
 * @param {string}  [options.message]
 * @param {object}  [options.meta] - Pagination or other metadata
 */
function sendSuccess(res, data, { statusCode = 200, message, meta } = {}) {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

/**
 * Send a created (201) response.
 */
function sendCreated(res, data, message) {
  return sendSuccess(res, data, { statusCode: 201, message });
}

/**
 * Send a no-content (204) response.
 */
function sendNoContent(res) {
  return res.status(204).end();
}

/**
 * Send an error response. Prefer throwing AppError subclasses and letting
 * the global error handler call this instead of calling directly.
 */
function sendError(res, { statusCode = 500, message = 'Internal server error', code, details } = {}) {
  const body = {
    success: false,
    error: {
      code: code || 'INTERNAL_ERROR',
      message,
      ...(details && { details }),
    },
  };
  return res.status(statusCode).json(body);
}

/**
 * Build pagination metadata from Sequelize count/rows result.
 */
function paginationMeta({ count, page, limit }) {
  return {
    total: count,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(count / limit),
  };
}

module.exports = { sendSuccess, sendCreated, sendNoContent, sendError, paginationMeta };
