'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const { requestId, requestLogger } = require('./api/middleware/requestLogger.middleware');
const { errorHandler, notFoundHandler } = require('./api/middleware/error.middleware');

const healthRoutes = require('./api/routes/health.routes');
const employeeRoutes = require('./api/routes/employee.routes');
const attendanceRoutes = require('./api/routes/attendance.routes');

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
  })
);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use(limiter);

// ─── Request logging ──────────────────────────────────────────────────────────
app.use(requestId);
app.use(requestLogger);

// ─── Trust proxy (for rate-limiter IP detection behind load balancers) ────────
app.set('trust proxy', 1);

// ─── API Documentation ────────────────────────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Attendance Tracking API',
    swaggerOptions: { persistAuthorization: true },
  })
);

app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// Health / metrics are available without the API prefix (for k8s probes)
app.use('/', healthRoutes);

app.use(`${apiPrefix}/employees`, employeeRoutes);
app.use(`${apiPrefix}/attendance`, attendanceRoutes);

// ─── 404 & error handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
