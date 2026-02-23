'use strict';

const { db } = require('../../db');
const config = require('../../config/env');
const { success } = require('../../utils/response');

const startTime = Date.now();

const healthController = {
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Service health check
   *     tags: [Health]
   *     security: []
   *     responses:
   *       200:
   *         description: Service is healthy
   *       503:
   *         description: Service is degraded
   */
  async health(req, res) {
    const checks = { database: 'unknown' };
    let isHealthy = true;

    try {
      await db.raw('SELECT 1');
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
      isHealthy = false;
    }

    const statusCode = isHealthy ? 200 : 503;
    return res.status(statusCode).json({
      success: isHealthy,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        service: config.server.serviceName,
        version: process.env.npm_package_version || '1.0.0',
        environment: config.env,
        checks,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * @swagger
   * /metrics:
   *   get:
   *     summary: Basic process metrics
   *     tags: [Health]
   *     security: []
   *     responses:
   *       200:
   *         description: Process memory and uptime metrics
   */
  async metrics(req, res) {
    const mem = process.memoryUsage();
    return success(res, {
      uptime_seconds: Math.floor(process.uptime()),
      memory: {
        rss_mb: Math.round(mem.rss / 1024 / 1024),
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
        external_mb: Math.round(mem.external / 1024 / 1024),
      },
      node_version: process.version,
      pid: process.pid,
      timestamp: new Date().toISOString(),
    });
  },
};

module.exports = healthController;
