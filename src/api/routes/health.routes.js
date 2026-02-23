const { Router } = require('express');
const { sequelize } = require('../../database/connection');
const appConfig = require('../../config/app.config');
const { sendSuccess } = require('../../utils/response');

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *       503:
 *         description: Service is degraded
 */
router.get('/', async (_req, res) => {
  const checks = {};
  let overallStatus = 'healthy';

  // Database connectivity check
  try {
    await sequelize.authenticate();
    checks.database = { status: 'up', latencyMs: null };
    const start = Date.now();
    await sequelize.query('SELECT 1');
    checks.database.latencyMs = Date.now() - start;
  } catch (err) {
    checks.database = { status: 'down', error: err.message };
    overallStatus = 'degraded';
  }

  // Memory usage
  const mem = process.memoryUsage();
  checks.memory = {
    heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    rssMb: Math.round(mem.rss / 1024 / 1024),
  };

  const payload = {
    status: overallStatus,
    service: appConfig.appName,
    version: appConfig.appVersion,
    env: appConfig.env,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    checks,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  return res.status(statusCode).json({ success: overallStatus === 'healthy', data: payload });
});

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Basic application metrics
 *     tags: [Health]
 */
router.get('/metrics', (_req, res) => {
  const mem = process.memoryUsage();
  return sendSuccess(res, {
    uptime: process.uptime(),
    memoryMb: {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      rss: Math.round(mem.rss / 1024 / 1024),
      external: Math.round(mem.external / 1024 / 1024),
    },
    cpu: process.cpuUsage(),
    pid: process.pid,
    nodeVersion: process.version,
  });
});

module.exports = router;
