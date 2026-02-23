'use strict';

const { Router } = require('express');
const employeeRoutes = require('./employeeRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const HealthController = require('../controllers/healthController');

const router = Router();

// Health & observability (no auth required)
router.get('/health', HealthController.liveness);
router.get('/health/ready', HealthController.readiness);
router.get('/metrics', HealthController.metrics);

// API v1 routes
router.use('/api/v1/employees', employeeRoutes);
router.use('/api/v1/attendance', attendanceRoutes);

// Catch-all for unknown routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route '${req.method} ${req.originalUrl}' not found`,
  });
});

module.exports = router;
