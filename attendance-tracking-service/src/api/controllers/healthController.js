'use strict';

const { checkConnection } = require('../../config/database');
const { register } = require('../../utils/metrics');
const env = require('../../config/env');

/**
 * Health and observability endpoints controller.
 */
class HealthController {
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Basic liveness probe
   *     tags: [Health]
   *     security: []
   *     responses:
   *       200:
   *         description: Service is running
   */
  static liveness(req, res) {
    res.json({
      status: 'ok',
      service: env.app.name,
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * @swagger
   * /health/ready:
   *   get:
   *     summary: Readiness probe — checks all dependencies
   *     tags: [Health]
   *     security: []
   *     responses:
   *       200:
   *         description: Service is ready
   *       503:
   *         description: Service is not ready
   */
  static async readiness(req, res) {
    const dbOk = await checkConnection();

    const checks = {
      database: dbOk ? 'ok' : 'fail',
    };

    const allOk = Object.values(checks).every((s) => s === 'ok');

    res.status(allOk ? 200 : 503).json({
      status: allOk ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * @swagger
   * /metrics:
   *   get:
   *     summary: Prometheus metrics endpoint
   *     tags: [Health]
   *     security: []
   *     produces:
   *       - text/plain
   *     responses:
   *       200:
   *         description: Prometheus metrics
   */
  static async metrics(req, res) {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  }
}

module.exports = HealthController;
