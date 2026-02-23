const { Router } = require('express');
const { liveness, readiness, metrics } = require('../controllers/healthController');

const router = Router();

router.get('/', liveness);
router.get('/ready', readiness);
router.get('/metrics', metrics);

module.exports = router;
