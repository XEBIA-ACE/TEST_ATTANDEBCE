'use strict';

const { Router } = require('express');
const { pool } = require('../../config/database');

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Service health and readiness probes
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Liveness probe – confirms the process is running
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe – confirms the service can accept traffic (DB reachable)
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready (e.g. DB unavailable)
 */
router.get('/health/ready', async (_req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'not ready',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Basic process metrics
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Process memory and uptime stats
 */
router.get('/metrics', (_req, res) => {
  const mem = process.memoryUsage();
  res.status(200).json({
    uptime_seconds: process.uptime(),
    memory: {
      rss_mb: (mem.rss / 1024 / 1024).toFixed(2),
      heap_used_mb: (mem.heapUsed / 1024 / 1024).toFixed(2),
      heap_total_mb: (mem.heapTotal / 1024 / 1024).toFixed(2),
    },
    node_version: process.version,
    pid: process.pid,
  });
});

module.exports = router;
