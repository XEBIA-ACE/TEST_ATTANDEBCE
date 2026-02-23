'use strict';

const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
  // Clear existing data in correct order to respect FK constraints
  await knex('attendance_records').del();
  await knex('employees').del();

  const passwordHash = await bcrypt.hash('Password123!', 12);

  await knex('employees').insert([
    {
      employee_code: 'EMP-001',
      first_name: 'Alice',
      last_name: 'Johnson',
      email: 'alice.johnson@example.com',
      phone: '+1-555-0101',
      department: 'Engineering',
      position: 'Senior Developer',
      status: 'active',
      hire_date: '2021-03-15',
      password_hash: passwordHash,
    },
    {
      employee_code: 'EMP-002',
      first_name: 'Bob',
      last_name: 'Smith',
      email: 'bob.smith@example.com',
      phone: '+1-555-0102',
      department: 'Engineering',
      position: 'Junior Developer',
      status: 'active',
      hire_date: '2023-06-01',
      password_hash: passwordHash,
    },
    {
      employee_code: 'EMP-003',
      first_name: 'Carol',
      last_name: 'Williams',
      email: 'carol.williams@example.com',
      phone: '+1-555-0103',
      department: 'HR',
      position: 'HR Manager',
      status: 'active',
      hire_date: '2020-01-10',
      password_hash: passwordHash,
    },
  ]);
};
