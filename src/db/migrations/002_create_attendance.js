'use strict';

/**
 * Migration: Create attendance_records table
 *
 * Each row represents a single day's attendance for one employee.
 * A unique constraint on (employee_id, date) prevents duplicate daily records.
 *
 * work_hours is computed and stored on check-out for efficient reporting.
 */
exports.up = async (knex) => {
  await knex.schema.createTable('attendance_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('employee_id')
      .notNullable()
      .references('id')
      .inTable('employees')
      .onDelete('CASCADE');
    table.date('date').notNullable();
    table.timestamp('check_in', { useTz: true }).nullable();
    table.timestamp('check_out', { useTz: true }).nullable();
    table
      .enu('status', ['present', 'absent', 'late', 'half_day', 'on_leave'])
      .notNullable()
      .defaultTo('present');
    table.decimal('work_hours', 5, 2).nullable().comment('Total hours worked, computed on check-out');
    table.boolean('is_overtime').defaultTo(false);
    table.text('notes').nullable();
    table.string('check_in_location', 255).nullable();
    table.string('check_out_location', 255).nullable();
    table.timestamps(true, true);

    // One record per employee per day
    table.unique(['employee_id', 'date']);

    // Indexes for common queries
    table.index('employee_id');
    table.index('date');
    table.index('status');
    table.index(['employee_id', 'date']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('attendance_records');
};
