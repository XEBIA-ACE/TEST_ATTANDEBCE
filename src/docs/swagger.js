const swaggerJsdoc = require('swagger-jsdoc');
const appConfig = require('../config/app.config');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Attendance Tracking Service API',
      version: appConfig.appVersion,
      description:
        'REST API for tracking employee attendance, clock-in/out events, breaks, and generating attendance reports.',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${appConfig.port}`,
        description: 'Local development server',
      },
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
        CreateEmployee: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'hireDate'],
          properties: {
            firstName: { type: 'string', example: 'Alice' },
            lastName: { type: 'string', example: 'Johnson' },
            email: { type: 'string', format: 'email', example: 'alice@example.com' },
            phone: { type: 'string', example: '+1-555-0100' },
            departmentId: { type: 'string', format: 'uuid' },
            position: { type: 'string', example: 'Software Engineer' },
            employmentType: {
              type: 'string',
              enum: ['full_time', 'part_time', 'contractor', 'intern'],
              default: 'full_time',
            },
            hireDate: { type: 'string', format: 'date', example: '2024-01-15' },
            scheduledHoursPerDay: { type: 'number', default: 8.0 },
            workDays: {
              type: 'array',
              items: { type: 'integer', minimum: 1, maximum: 7 },
              default: [1, 2, 3, 4, 5],
            },
            timezone: { type: 'string', default: 'UTC', example: 'America/New_York' },
          },
        },
        UpdateEmployee: {
          type: 'object',
          minProperties: 1,
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            departmentId: { type: 'string', format: 'uuid', nullable: true },
            position: { type: 'string' },
            employmentType: {
              type: 'string',
              enum: ['full_time', 'part_time', 'contractor', 'intern'],
            },
            hireDate: { type: 'string', format: 'date' },
            terminationDate: { type: 'string', format: 'date', nullable: true },
            scheduledHoursPerDay: { type: 'number' },
            workDays: { type: 'array', items: { type: 'integer' } },
            timezone: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        ClockIn: {
          type: 'object',
          required: ['employeeId'],
          properties: {
            employeeId: { type: 'string', format: 'uuid' },
            date: {
              type: 'string',
              format: 'date',
              description: 'Defaults to today if omitted',
            },
            location: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' },
                address: { type: 'string' },
              },
            },
            notes: { type: 'string' },
          },
        },
        ClockOut: {
          type: 'object',
          required: ['employeeId'],
          properties: {
            employeeId: { type: 'string', format: 'uuid' },
            location: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' },
                address: { type: 'string' },
              },
            },
            notes: { type: 'string' },
          },
        },
        ErrorResponse: {
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
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/api/controllers/*.js', './src/api/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
