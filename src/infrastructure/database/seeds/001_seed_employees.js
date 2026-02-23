const { v4: uuidv4 } = require('uuid');

/**
 * Seed: Insert sample employees for local development and testing.
 * Run with: npm run seed
 */
const employeeIds = [uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4()];

exports.seed = async function (knex) {
  // Clear existing data in reverse dependency order
  await knex('attendance_records').del();
  await knex('employees').del();

  await knex('employees').insert([
    {
      id: employeeIds[0],
      employee_code: 'EMP-0001',
      first_name: 'Alice',
      last_name: 'Johnson',
      email: 'alice.johnson@example.com',
      department: 'Engineering',
      position: 'Software Engineer',
      status: 'active',
      hire_date: '2022-01-15',
    },
    {
      id: employeeIds[1],
      employee_code: 'EMP-0002',
      first_name: 'Bob',
      last_name: 'Smith',
      email: 'bob.smith@example.com',
      department: 'Engineering',
      position: 'Senior Software Engineer',
      status: 'active',
      hire_date: '2021-06-01',
    },
    {
      id: employeeIds[2],
      employee_code: 'EMP-0003',
      first_name: 'Carol',
      last_name: 'Williams',
      email: 'carol.williams@example.com',
      department: 'HR',
      position: 'HR Manager',
      status: 'active',
      hire_date: '2020-03-10',
    },
    {
      id: employeeIds[3],
      employee_code: 'EMP-0004',
      first_name: 'David',
      last_name: 'Brown',
      email: 'david.brown@example.com',
      department: 'Sales',
      position: 'Sales Representative',
      status: 'on_leave',
      hire_date: '2023-02-20',
    },
    {
      id: employeeIds[4],
      employee_code: 'EMP-0005',
      first_name: 'Eve',
      last_name: 'Davis',
      email: 'eve.davis@example.com',
      department: 'Engineering',
      position: 'QA Engineer',
      status: 'active',
      hire_date: '2022-09-01',
    },
  ]);

  // Seed a few attendance records for the past week
  const today = new Date();
  const records = [];

  for (let daysAgo = 1; daysAgo <= 5; daysAgo++) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];

    [employeeIds[0], employeeIds[1], employeeIds[4]].forEach((empId) => {
      const checkIn = new Date(`${dateStr}T09:00:00`);
      const checkOut = new Date(`${dateStr}T17:30:00`);
      records.push({
        id: uuidv4(),
        employee_id: empId,
        date: dateStr,
        check_in: checkIn,
        check_out: checkOut,
        status: 'present',
      });
    });

    // Carol: occasional late arrival
    records.push({
      id: uuidv4(),
      employee_id: employeeIds[2],
      date: dateStr,
      check_in: new Date(`${dateStr}T09:${daysAgo % 2 === 0 ? '20' : '05'}:00`),
      check_out: new Date(`${dateStr}T17:30:00`),
      status: daysAgo % 2 === 0 ? 'late' : 'present',
    });
  }

  await knex('attendance_records').insert(records);
};
