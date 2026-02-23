'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const appConfig = require('./config/app.config');
const swaggerSpec = require('./config/swagger.config');
const requestLogger = require('./api/middlewares/requestLogger.middleware');
const { notFound, globalErrorHandler } = require('./api/middlewares/error.middleware');

// Routes
const healthRoutes = require('./api/routes/health.routes');
const employeeRoutes = require('./api/routes/employee.routes');
const attendanceRoutes = require('./api/routes/attendance.routes');

const app = express();

// ── Trust proxy (needed for correct IP behind load balancers/nginx) ────────────
app.set('trust proxy', 1);

// ── Security headers ───────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: appConfig.cors.origin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing & compression ─────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(compression());

// ── Request logging ────────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Rate limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ── API routes ─────────────────────────────────────────────────────────────────
const API_PREFIX = '/api/v1';

app.use('/health', healthRoutes);
app.use(`${API_PREFIX}/employees`, employeeRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceRoutes);

// ── Swagger UI ─────────────────────────────────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Attendance Tracking API',
    swaggerOptions: { persistAuthorization: true },
  })
);

// Expose raw OpenAPI spec as JSON (useful for code generation)
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// ── 404 & global error handler ─────────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

// ── Bootstrap ──────────────────────────────────────────────────────────────────
if (require.main === module) {
  const { connectDatabase } = require('./data/database');
  const { Employee, Attendance } = require('./data/models');
  const logger = require('./utils/logger');

  (async () => {
    try {
      await connectDatabase();

      // Auto-sync schema in development; in production run migrations explicitly
      if (appConfig.env !== 'production') {
        await Employee.sync({ alter: true });
        await Attendance.sync({ alter: true });
        logger.info('Database schema synchronised (development mode)');
      }

      app.listen(appConfig.port, () => {
        logger.info(
          `🚀 ${appConfig.appName} running on port ${appConfig.port} [${appConfig.env}]`
        );
        logger.info(`   API docs: http://localhost:${appConfig.port}/api-docs`);
        logger.info(`   Health:   http://localhost:${appConfig.port}/health`);
      });
    } catch (err) {
      logger.error('Failed to start server:', err);
      process.exit(1);
    }
  })();
}

module.exports = app;
