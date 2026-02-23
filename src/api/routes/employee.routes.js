const { Router } = require('express');
const controller = require('../controllers/employee.controller');
const validate = require('../middlewares/validate.middleware');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesSchema,
} = require('../validators/employee.validator');

const router = Router();

// GET  /api/v1/employees
router.get('/', validate(listEmployeesSchema, 'query'), controller.list);

// GET  /api/v1/employees/:id
router.get('/:id', controller.get);

// POST /api/v1/employees
router.post('/', validate(createEmployeeSchema), controller.create);

// PATCH /api/v1/employees/:id
router.patch('/:id', validate(updateEmployeeSchema), controller.update);

// DELETE /api/v1/employees/:id
router.delete('/:id', controller.delete);

module.exports = router;
