'use strict';

const client = require('prom-client');
const env = require('../config/env');

// Create a Registry to register metrics
const register = new client.Registry();

// Add default Node.js metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({ register, prefix: 'attendance_' });

/**
 * HTTP request duration histogram.
 */
const httpRequestDurationSeconds = new client.Histogram({
  name: 'attendance_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

/**
 * HTTP request counter.
 */
const httpRequestsTotal = new client.Counter({
  name: 'attendance_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * Active database connections gauge.
 */
const dbConnectionsGauge = new client.Gauge({
  name: 'attendance_db_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

/**
 * Attendance check-in counter.
 */
const checkInsTotal = new client.Counter({
  name: 'attendance_check_ins_total',
  help: 'Total number of check-ins recorded',
  registers: [register],
});

/**
 * Attendance check-out counter.
 */
const checkOutsTotal = new client.Counter({
  name: 'attendance_check_outs_total',
  help: 'Total number of check-outs recorded',
  registers: [register],
});

/**
 * Express middleware to record request metrics.
 */
function metricsMiddleware(req, res, next) {
  if (!env.metrics.enabled) return next();

  const end = httpRequestDurationSeconds.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    const labels = { method: req.method, route, status_code: res.statusCode };
    end(labels);
    httpRequestsTotal.inc(labels);
  });
  next();
}

module.exports = {
  register,
  metricsMiddleware,
  httpRequestDurationSeconds,
  httpRequestsTotal,
  dbConnectionsGauge,
  checkInsTotal,
  checkOutsTotal,
};
