'use strict';

/**
 * Seed file: Sample employees for development and testing.
 */
exports.seed = async (knex) => {
  // Remove existing data in reverse dependency order
  await knex('attendance_records').del();
  await knex('employees').del();

  await knex('employees').insert([
    {
      employee_code: 'EMP001',
      first_name: 'Alice',
      last_name: 'Johnson',
      email: 'alice.johnson@example.com',
      phone: '+1-555-0101',
      department: 'Engineering',
      position: 'Senior Software Engineer',
      status: 'active',
      hire_date: '2022-01-15',
      expected_check_in: '09:00:00',
      expected_check_out: '18:00:00',
    },
    {
      employee_code: 'EMP002',
      first_name: 'Bob',
      last_name: 'Smith',
      email: 'bob.smith@example.com',
      phone: '+1-555-0102',
      department: 'Engineering',
      position: 'Software Engineer',
      status: 'active',
      hire_date: '2023-03-01',
      expected_check_in: '09:00:00',
      expected_check_out: '18:00:00',
    },
    {
      employee_code: 'EMP003',
      first_name: 'Carol',
      last_name: 'Williams',
      email: 'carol.williams@example.com',
      phone: '+1-555-0103',
      department: 'HR',
      position: 'HR Manager',
      status: 'active',
      hire_date: '2021-06-01',
      expected_check_in: '08:30:00',
      expected_check_out: '17:30:00',
    },
  ]);
};
