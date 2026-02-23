'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./index');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Attendance Tracking Service API',
      version: '1.0.0',
      description:
        'A production-ready RESTful API for tracking employee attendance, ' +
        'check-ins, check-outs, and generating attendance reports.',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}/api/${config.server.apiVersion}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Employee: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            employee_code: { type: 'string', example: 'EMP-001' },
            first_name: { type: 'string', example: 'Jane' },
            last_name: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email' },
            department: { type: 'string', example: 'Engineering' },
            position: { type: 'string', example: 'Senior Developer' },
            status: { type: 'string', enum: ['active', 'inactive', 'on_leave'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        AttendanceRecord: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            employee_id: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date', example: '2024-01-15' },
            check_in_time: { type: 'string', format: 'date-time' },
            check_out_time: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['present', 'absent', 'late', 'half_day', 'on_leave'] },
            work_hours: { type: 'number', example: 8.5 },
            notes: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/api/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
