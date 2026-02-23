'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const routes = require('./api/routes');
const requestLogger = require('./api/middlewares/requestLogger');
const errorHandler = require('./api/middlewares/errorHandler');
const { metricsMiddleware } = require('./utils/metrics');

const app = express();

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet());                          // Set secure HTTP headers
app.use(cors({ origin: env.cors.origin })); // Cross-origin resource sharing
app.set('trust proxy', 1);                  // Trust first proxy (needed for rate limiting behind reverse proxy)

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api/', limiter);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ─── Observability ───────────────────────────────────────────────────────────
app.use(requestLogger);
app.use(metricsMiddleware);

// ─── API Documentation ───────────────────────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'Attendance Tracking API Docs',
  })
);

// Expose raw swagger spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── Application Routes ───────────────────────────────────────────────────────
app.use(routes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
