'use strict';

/**
 * Standardizes all API responses into a consistent shape:
 * { success, message, data, meta }
 */
const ResponseHelper = {
  /**
   * Send a successful response.
   * @param {import('express').Response} res
   * @param {object} options
   */
  success(res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) {
    const body = { success: true, message };
    if (data !== null) body.data = data;
    if (meta !== null) body.meta = meta;
    return res.status(statusCode).json(body);
  },

  /**
   * Send a created (201) response.
   */
  created(res, { message = 'Resource created', data = null } = {}) {
    return this.success(res, { statusCode: 201, message, data });
  },

  /**
   * Send an error response.
   * @param {import('express').Response} res
   * @param {object} options
   */
  error(res, { statusCode = 500, message = 'Internal Server Error', errors = null } = {}) {
    const body = { success: false, message };
    if (errors !== null) body.errors = errors;
    return res.status(statusCode).json(body);
  },

  /**
   * Build pagination meta from Sequelize count+rows result.
   * @param {number} total   - Total number of records
   * @param {number} page    - Current page (1-indexed)
   * @param {number} limit   - Items per page
   */
  paginationMeta(total, page, limit) {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};

module.exports = ResponseHelper;
