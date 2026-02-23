const { v4: uuidv4 } = require('uuid');

/**
 * Seed: Sample employees for local development and testing.
 */
exports.seed = async (knex) => {
  await knex('attendance_records').del();
  await knex('employees').del();

  const managerId = uuidv4();

  await knex('employees').insert([
    {
      id: managerId,
      first_name: 'Alice',
      last_name: 'Smith',
      email: 'alice.smith@example.com',
      department: 'Engineering',
      position: 'Engineering Manager',
      employment_type: 'full_time',
      hire_date: '2020-01-15',
      is_active: true,
      manager_id: null,
    },
    {
      id: uuidv4(),
      first_name: 'Bob',
      last_name: 'Johnson',
      email: 'bob.johnson@example.com',
      department: 'Engineering',
      position: 'Senior Software Engineer',
      employment_type: 'full_time',
      hire_date: '2021-03-10',
      is_active: true,
      manager_id: managerId,
    },
    {
      id: uuidv4(),
      first_name: 'Carol',
      last_name: 'Williams',
      email: 'carol.williams@example.com',
      department: 'HR',
      position: 'HR Specialist',
      employment_type: 'full_time',
      hire_date: '2019-07-22',
      is_active: true,
      manager_id: null,
    },
    {
      id: uuidv4(),
      first_name: 'David',
      last_name: 'Brown',
      email: 'david.brown@example.com',
      department: 'Marketing',
      position: 'Marketing Coordinator',
      employment_type: 'part_time',
      hire_date: '2022-11-01',
      is_active: true,
      manager_id: null,
    },
  ]);
};
