'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const swaggerSpec = require('./config/swagger');
const routes = require('./api/routes');
const requestLogger = require('./api/middlewares/requestLogger');
const errorHandler = require('./api/middlewares/errorHandler');
const { sendError } = require('./utils/response');

const app = express();

// ─── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ─── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Request logging ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ─── Rate limiting ─────────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  })
);

// ─── API docs (non-production only) ────────────────────────────────────────────
if (!config.isProd) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
}

// ─── API routes ────────────────────────────────────────────────────────────────
app.use(`/api/${config.server.apiVersion}`, routes);

// ─── Root redirect ─────────────────────────────────────────────────────────────
app.get('/', (req, res) =>
  res.json({
    service: 'Attendance Tracking Service',
    version: config.server.apiVersion,
    docs: config.isProd ? null : '/api-docs',
    health: `/api/${config.server.apiVersion}/health`,
  })
);

// ─── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND');
});

// ─── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
