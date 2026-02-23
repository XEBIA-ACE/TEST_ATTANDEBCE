const { Router } = require('express');
const healthRoutes = require('./healthRoutes');
const employeeRoutes = require('./employeeRoutes');
const attendanceRoutes = require('./attendanceRoutes');

const router = Router();

const API_VERSION = process.env.API_VERSION || 'v1';

router.use('/health', healthRoutes);
router.use(`/${API_VERSION}/employees`, employeeRoutes);
router.use(`/${API_VERSION}/attendance`, attendanceRoutes);

module.exports = router;
