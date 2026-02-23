'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Seed: Insert sample attendance records for development.
 * Requires employees seed to run first.
 */
exports.seed = async function (knex) {
  await knex('attendance_records').del();

  // Fetch seeded employees
  const employees = await knex('employees').select('id', 'employee_number').whereNull('deleted_at');

  if (employees.length === 0) {
    console.log('No employees found — skipping attendance seed');
    return;
  }

  const records = [];
  const today = new Date();

  // Generate 7 days of attendance history for each employee
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dateStr = date.toISOString().split('T')[0];

    for (const employee of employees) {
      const checkIn = new Date(date);
      checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0); // 09:00-09:29

      const checkOut = new Date(date);
      checkOut.setHours(17, Math.floor(Math.random() * 60), 0, 0); // 17:00-17:59

      const totalHours = (checkOut - checkIn) / (1000 * 60 * 60);

      // Randomly assign status
      const rand = Math.random();
      let status = 'present';
      if (rand < 0.05) status = 'absent';
      else if (rand < 0.12) status = 'late';
      else if (rand < 0.16) status = 'half_day';

      records.push({
        id: uuidv4(),
        employee_id: employee.id,
        date: dateStr,
        check_in: status === 'absent' ? null : checkIn,
        check_out: status === 'absent' ? null : checkOut,
        status,
        total_hours: status === 'absent' ? null : Math.round(totalHours * 100) / 100,
        notes: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  }

  if (records.length > 0) {
    await knex('attendance_records').insert(records);
  }

  console.log(`Seeded ${records.length} attendance records`);
};
