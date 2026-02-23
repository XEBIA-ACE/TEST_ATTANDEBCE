const { Router } = require('express');
const { getDatabase } = require('../../config/database');
const config = require('../../config');

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Basic liveness check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is running
 */
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: config.appName,
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @openapi
 * /health/ready:
 *   get:
 *     summary: Readiness check — verifies DB connectivity
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready (DB unreachable)
 */
router.get('/ready', async (req, res) => {
  try {
    const db = getDatabase();
    await db.raw('SELECT 1');

    res.json({
      status: 'ready',
      checks: {
        database: 'ok',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'not_ready',
      checks: {
        database: 'failed',
      },
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @openapi
 * /health/metrics:
 *   get:
 *     summary: Basic runtime metrics
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Runtime metrics
 */
router.get('/metrics', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    uptime_seconds: process.uptime(),
    memory: {
      rss_mb: (memUsage.rss / 1024 / 1024).toFixed(2),
      heap_used_mb: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
      heap_total_mb: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
    },
    node_version: process.version,
    env: config.env,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
