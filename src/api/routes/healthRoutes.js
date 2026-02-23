'use strict';

const { Router } = require('express');
const healthController = require('../controllers/healthController');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Service health and observability endpoints
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Liveness probe
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is running
 */
router.get('/', healthController.live);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe (checks DB)
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready (DB unavailable)
 */
router.get('/ready', healthController.ready);

/**
 * @swagger
 * /health/metrics:
 *   get:
 *     summary: Runtime metrics
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Uptime, memory, CPU metrics
 */
router.get('/metrics', healthController.metrics);

module.exports = router;
