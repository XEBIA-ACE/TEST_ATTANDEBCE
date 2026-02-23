const { v4: uuidv4 } = require('uuid');
const employeeRepository = require('../../data/repositories/employeeRepository');
const { AppError } = require('../../api/middlewares/errorHandler');
const logger = require('../../config/logger');

/**
 * Business logic for employee management.
 * All methods validate business rules before delegating to the repository.
 */

/**
 * Creates a new employee record.
 * Enforces email uniqueness and validates managerId existence.
 *
 * @param {Object} data - Validated employee payload
 * @returns {Object} Created employee
 */
const createEmployee = async (data) => {
  const existing = await employeeRepository.findByEmail(data.email);
  if (existing) {
    throw new AppError(`An employee with email '${data.email}' already exists`, 409);
  }

  if (data.managerId) {
    const manager = await employeeRepository.findById(data.managerId);
    if (!manager) {
      throw new AppError(`Manager with id '${data.managerId}' not found`, 400);
    }
  }

  const employee = await employeeRepository.create({
    ...data,
    id: uuidv4(),
  });

  logger.info('Employee created', { employeeId: employee.id, email: employee.email });
  return employee;
};

/**
 * Returns a paginated, filtered list of employees.
 *
 * @param {Object} filters - Query filters from the request
 * @returns {{ employees: Object[], pagination: Object }}
 */
const listEmployees = async (filters) => {
  const { page, pageSize, ...rest } = filters;
  const offset = (page - 1) * pageSize;

  const [employees, total] = await Promise.all([
    employeeRepository.findAll({ ...rest, limit: pageSize, offset }),
    employeeRepository.count(rest),
  ]);

  return {
    employees,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

/**
 * Retrieves a single employee by ID.
 * Throws 404 if not found.
 *
 * @param {string} id - Employee UUID
 * @returns {Object} Employee record
 */
const getEmployeeById = async (id) => {
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new AppError(`Employee with id '${id}' not found`, 404);
  }
  return employee;
};

/**
 * Updates employee fields.
 * Validates email uniqueness if the email is being changed.
 *
 * @param {string} id - Employee UUID
 * @param {Object} data - Fields to update
 * @returns {Object} Updated employee
 */
const updateEmployee = async (id, data) => {
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new AppError(`Employee with id '${id}' not found`, 404);
  }

  if (data.email && data.email !== employee.email) {
    const emailTaken = await employeeRepository.findByEmail(data.email);
    if (emailTaken) {
      throw new AppError(`Email '${data.email}' is already in use`, 409);
    }
  }

  if (data.managerId) {
    if (data.managerId === id) {
      throw new AppError('An employee cannot be their own manager', 400);
    }
    const manager = await employeeRepository.findById(data.managerId);
    if (!manager) {
      throw new AppError(`Manager with id '${data.managerId}' not found`, 400);
    }
  }

  const updated = await employeeRepository.update(id, data);
  logger.info('Employee updated', { employeeId: id });
  return updated;
};

/**
 * Soft-deletes an employee by setting isActive = false.
 * Preserves attendance history and referential integrity.
 *
 * @param {string} id - Employee UUID
 */
const deactivateEmployee = async (id) => {
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new AppError(`Employee with id '${id}' not found`, 404);
  }

  await employeeRepository.update(id, { isActive: false });
  logger.info('Employee deactivated', { employeeId: id });
};

module.exports = { createEmployee, listEmployees, getEmployeeById, updateEmployee, deactivateEmployee };
