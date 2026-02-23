'use strict';

const { Router } = require('express');
const { sequelize } = require('../../data/database');
const appConfig = require('../../config/app.config');

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Service liveness check
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:   { type: string, example: ok }
 *                 uptime:   { type: number, example: 42.3 }
 *                 timestamp: { type: string, format: date-time }
 *
 * /health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Service readiness check (includes DB connectivity)
 *     security: []
 *     responses:
 *       200:
 *         description: Service is ready to accept traffic
 *       503:
 *         description: Service is not ready (DB unreachable)
 */

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: appConfig.appName,
    env: appConfig.env,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.get('/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: 'not_ready',
      database: 'unreachable',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
