require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('./connection');
const logger = require('../config/logger.config');

async function seed() {
  const transaction = await sequelize.transaction();
  try {
    const queryInterface = sequelize.getQueryInterface();
    const now = new Date();

    // --- Departments ---
    const engineeringId = uuidv4();
    const hrId = uuidv4();

    await queryInterface.bulkInsert(
      'departments',
      [
        {
          id: engineeringId,
          name: 'Engineering',
          description: 'Software Engineering Department',
          is_active: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: hrId,
          name: 'Human Resources',
          description: 'HR and People Operations',
          is_active: true,
          created_at: now,
          updated_at: now,
        },
      ],
      { transaction },
    );

    // --- Employees ---
    const emp1Id = uuidv4();
    const emp2Id = uuidv4();

    await queryInterface.bulkInsert(
      'employees',
      [
        {
          id: emp1Id,
          employee_number: 'EMP-0001',
          first_name: 'Alice',
          last_name: 'Johnson',
          email: 'alice.johnson@example.com',
          department_id: engineeringId,
          position: 'Senior Software Engineer',
          employment_type: 'full_time',
          hire_date: '2022-01-15',
          scheduled_hours_per_day: 8.0,
          work_days: [1, 2, 3, 4, 5],
          timezone: 'America/New_York',
          is_active: true,
          created_at: now,
          updated_at: now,
        },
        {
          id: emp2Id,
          employee_number: 'EMP-0002',
          first_name: 'Bob',
          last_name: 'Smith',
          email: 'bob.smith@example.com',
          department_id: hrId,
          position: 'HR Manager',
          employment_type: 'full_time',
          hire_date: '2021-06-01',
          scheduled_hours_per_day: 8.0,
          work_days: [1, 2, 3, 4, 5],
          timezone: 'America/Chicago',
          is_active: true,
          created_at: now,
          updated_at: now,
        },
      ],
      { transaction },
    );

    // --- Sample attendance records ---
    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];
    const clockIn = new Date(today);
    clockIn.setHours(9, 0, 0, 0);
    const clockOut = new Date(today);
    clockOut.setHours(17, 30, 0, 0);

    await queryInterface.bulkInsert(
      'attendance_records',
      [
        {
          id: uuidv4(),
          employee_id: emp1Id,
          date: todayDate,
          clock_in: clockIn,
          clock_out: clockOut,
          total_hours: 8.5,
          overtime_hours: 0.5,
          status: 'present',
          break_duration_minutes: 30,
          is_manual_entry: false,
          created_at: now,
          updated_at: now,
        },
      ],
      { transaction },
    );

    await transaction.commit();
    logger.info('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    logger.error('Seeding failed', { error: error.message });
    process.exit(1);
  }
}

seed();
