'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Attendance Tracking Service API',
      version: '1.0.0',
      description: 'REST API for managing employee attendance records.',
      contact: { name: 'API Support', email: 'support@example.com' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:3000/api/v1', description: 'Development' },
      { url: 'https://staging.example.com/api/v1', description: 'Staging' },
      { url: 'https://api.example.com/api/v1', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
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
            position: { type: 'string', example: 'Software Engineer' },
            is_active: { type: 'boolean', example: true },
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
            check_out_time: { type: 'string', format: 'date-time', nullable: true },
            status: {
              type: 'string',
              enum: ['present', 'absent', 'late', 'half_day', 'holiday', 'leave'],
            },
            notes: { type: 'string', nullable: true },
            total_hours: { type: 'number', format: 'float', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  // Scan all route files for JSDoc @swagger annotations
  apis: ['./src/api/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
