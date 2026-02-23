'use strict';

const { checkConnection } = require('../../config/database');
const { sendSuccess } = require('../../utils/response');
const config = require('../../config');
const os = require('os');

const startTime = Date.now();

const healthController = {
  /**
   * GET /health
   * Liveness probe — confirms the process is running.
   */
  live(req, res) {
    return sendSuccess(res, { status: 'ok' }, 'Service is running');
  },

  /**
   * GET /health/ready
   * Readiness probe — confirms the service can accept traffic
   * (checks DB connectivity).
   */
  async ready(req, res, next) {
    try {
      const dbOk = await checkConnection();

      const payload = {
        status: dbOk ? 'ready' : 'not_ready',
        database: dbOk ? 'connected' : 'disconnected',
      };

      return res
        .status(dbOk ? 200 : 503)
        .json({ success: dbOk, message: dbOk ? 'Service is ready' : 'Service not ready', data: payload });
    } catch (err) {
      return next(err);
    }
  },

  /**
   * GET /health/metrics
   * Basic runtime metrics for observability dashboards.
   */
  metrics(req, res) {
    const uptimeMs = Date.now() - startTime;
    const mem = process.memoryUsage();

    return sendSuccess(
      res,
      {
        uptime_ms: uptimeMs,
        uptime_human: `${Math.floor(uptimeMs / 60000)}m ${Math.floor((uptimeMs % 60000) / 1000)}s`,
        environment: config.env,
        node_version: process.version,
        memory: {
          rss_mb: (mem.rss / 1024 / 1024).toFixed(2),
          heap_used_mb: (mem.heapUsed / 1024 / 1024).toFixed(2),
          heap_total_mb: (mem.heapTotal / 1024 / 1024).toFixed(2),
        },
        cpu: {
          count: os.cpus().length,
          load_avg: os.loadavg(),
        },
      },
      'Metrics retrieved'
    );
  },
};

module.exports = healthController;
