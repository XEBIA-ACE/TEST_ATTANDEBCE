'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Seed: Insert sample employees for development.
 */
exports.seed = async function (knex) {
  // Delete existing entries to keep seeds idempotent
  await knex('attendance_records').del();
  await knex('employees').del();

  const now = new Date();

  const employees = [
    {
      id: uuidv4(),
      employee_number: 'EMP001',
      first_name: 'Alice',
      last_name: 'Johnson',
      email: 'alice.johnson@example.com',
      department: 'Engineering',
      position: 'Senior Software Engineer',
      status: 'active',
      hire_date: '2021-03-15',
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      employee_number: 'EMP002',
      first_name: 'Bob',
      last_name: 'Smith',
      email: 'bob.smith@example.com',
      department: 'Engineering',
      position: 'Software Engineer',
      status: 'active',
      hire_date: '2022-06-01',
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      employee_number: 'EMP003',
      first_name: 'Carol',
      last_name: 'Williams',
      email: 'carol.williams@example.com',
      department: 'HR',
      position: 'HR Manager',
      status: 'active',
      hire_date: '2020-01-10',
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      employee_number: 'EMP004',
      first_name: 'David',
      last_name: 'Brown',
      email: 'david.brown@example.com',
      department: 'Finance',
      position: 'Financial Analyst',
      status: 'active',
      hire_date: '2023-02-20',
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      employee_number: 'EMP005',
      first_name: 'Eve',
      last_name: 'Davis',
      email: 'eve.davis@example.com',
      department: 'Engineering',
      position: 'DevOps Engineer',
      status: 'on_leave',
      hire_date: '2021-09-05',
      created_at: now,
      updated_at: now,
    },
  ];

  await knex('employees').insert(employees);

  console.log(`Seeded ${employees.length} employees`);
};
