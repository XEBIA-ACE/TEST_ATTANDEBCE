'use strict';

/**
 * Migration: Create attendance_records table
 *
 * One row = one attendance entry for a specific employee on a specific date.
 * A unique constraint on (employee_id, date) prevents duplicate records
 * while still allowing multiple check-in/out updates on the same day.
 */
exports.up = function (knex) {
  return knex.schema.createTable('attendance_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('employee_id')
      .notNullable()
      .references('id')
      .inTable('employees')
      .onDelete('CASCADE');

    table.date('date').notNullable().comment('Calendar date of the attendance record (UTC)');
    table.timestamp('check_in_time', { useTz: true }).nullable();
    table.timestamp('check_out_time', { useTz: true }).nullable();

    table
      .enu('status', ['present', 'absent', 'late', 'half_day', 'on_leave'])
      .notNullable()
      .defaultTo('present');

    // Calculated and stored for reporting performance
    table.decimal('work_hours', 5, 2).nullable().comment('Total hours worked (check_out - check_in)');

    table.text('notes').nullable();
    table.timestamps(true, true);

    // One record per employee per day
    table.unique(['employee_id', 'date']);

    // Indexes for report queries
    table.index(['employee_id']);
    table.index(['date']);
    table.index(['status']);
    table.index(['employee_id', 'date']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('attendance_records');
};
