const { Router } = require('express');
const controller = require('../controllers/employeeController');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const v = require('../validators/employeeValidator');

const router = Router();

// All employee routes require authentication
router.use(authenticate);

router.post('/', authorize('admin', 'hr'), validate(v.createEmployee), controller.createEmployee);
router.get('/', validate(v.listEmployees), controller.listEmployees);
router.get('/:id', validate(v.getEmployee), controller.getEmployee);
router.put('/:id', authorize('admin', 'hr'), validate(v.updateEmployee), controller.updateEmployee);
router.delete('/:id', authorize('admin'), validate(v.getEmployee), controller.deleteEmployee);

module.exports = router;
