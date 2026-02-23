'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Attendance Tracking Service API',
      version: '1.0.0',
      description:
        'A production-ready REST API for tracking employee attendance, check-ins, check-outs, and generating reports.',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.app.port}/api/v1`,
        description: 'Development server',
      },
      {
        url: 'https://api.example.com/api/v1',
        description: 'Production server',
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
            id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
            employee_number: { type: 'string', example: 'EMP001' },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
            department: { type: 'string', example: 'Engineering' },
            position: { type: 'string', example: 'Software Engineer' },
            status: { type: 'string', enum: ['active', 'inactive', 'on_leave'], example: 'active' },
            hire_date: { type: 'string', format: 'date', example: '2023-01-15' },
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
            check_in: { type: 'string', format: 'date-time', example: '2024-01-15T09:00:00Z' },
            check_out: { type: 'string', format: 'date-time', example: '2024-01-15T17:00:00Z' },
            status: {
              type: 'string',
              enum: ['present', 'absent', 'late', 'half_day', 'on_leave'],
              example: 'present',
            },
            total_hours: { type: 'number', format: 'float', example: 8.0 },
            notes: { type: 'string', example: 'Regular workday' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'An error occurred' },
            errors: { type: 'array', items: { type: 'string' } },
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
  apis: ['./src/api/routes/*.js', './src/api/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
