const db = require('../../config/database');
const logger = require('../../config/logger');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic liveness probe
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is alive
 */
const liveness = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'attendance-tracking-service',
    version: process.env.npm_package_version || '1.0.0',
  });
};

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe — checks database connectivity
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is ready to serve traffic
 *       503:
 *         description: Service is not ready
 */
const readiness = async (req, res) => {
  const checks = { database: 'unknown' };

  try {
    await db.raw('SELECT 1');
    checks.database = 'healthy';
  } catch (err) {
    checks.database = 'unhealthy';
    logger.error('Readiness check failed — database unreachable', { error: err.message });
    return res.status(503).json({
      status: 'error',
      message: 'Service not ready',
      checks,
    });
  }

  return res.json({
    status: 'ok',
    checks,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

/**
 * @swagger
 * /health/metrics:
 *   get:
 *     summary: Basic process metrics
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Current process metrics
 */
const metrics = (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(mem.external / 1024 / 1024)} MB`,
    },
    cpu: process.cpuUsage(),
    pid: process.pid,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
  });
};

module.exports = { liveness, readiness, metrics };
