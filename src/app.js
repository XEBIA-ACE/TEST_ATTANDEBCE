'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/env');
const swaggerSpec = require('./config/swagger');
const apiRoutes = require('./api/routes');
const healthRoutes = require('./api/routes/health');
const errorHandler = require('./api/middlewares/errorHandler');
const requestLogger = require('./api/middlewares/requestLogger');
const { error } = require('./utils/response');

const app = express();

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
  })
);

// ─── Body parsing & compression ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ─── Request logging ─────────────────────────────────────────────────────────
app.use(requestLogger);

// ─── Rate limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
});
app.use(limiter);

// ─── Health & metrics (no API version prefix) ────────────────────────────────
app.use('/', healthRoutes);

// ─── Swagger UI ──────────────────────────────────────────────────────────────
if (!config.isProduction) {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: 'Attendance Tracking API Docs',
    })
  );
  app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
}

// ─── API routes ──────────────────────────────────────────────────────────────
app.use(`/api/${config.server.apiVersion}`, apiRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  error(res, `Cannot ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
});

// ─── Centralized error handler ───────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
