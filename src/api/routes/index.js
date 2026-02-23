'use strict';

const { Router } = require('express');
const employeeRoutes = require('./employeeRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const healthRoutes = require('./healthRoutes');

const router = Router();

router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/health', healthRoutes);

module.exports = router;
