const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const { v4: uuidv4 } = require('uuid');

const appConfig = require('./config/app.config');
const swaggerSpec = require('./docs/swagger');
const employeeRoutes = require('./api/routes/employee.routes');
const attendanceRoutes = require('./api/routes/attendance.routes');
const healthRoutes = require('./api/routes/health.routes');
const requestLogger = require('./api/middlewares/requestLogger.middleware');
const errorHandler = require('./api/middlewares/error.middleware');
const { sendError } = require('./utils/response');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman) in non-production
      if (!origin || appConfig.env !== 'production') return callback(null, true);
      if (appConfig.cors.origins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Request ID ────────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  next();
});

// ── Request logging ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
});
app.use('/api/', limiter);

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/health', healthRoutes);
app.use('/metrics', require('./api/routes/health.routes')); // reuse for /metrics path
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/attendance', attendanceRoutes);

// ── Swagger docs ──────────────────────────────────────────────────────────────
if (appConfig.env !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  sendError(res, {
    statusCode: 404,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
  });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
