'use strict';

/**
 * Migration: Create employees table
 *
 * Stores core employee information. The employee_code field is the
 * human-readable identifier (e.g., EMP001), while id is the internal UUID.
 */
exports.up = async (knex) => {
  await knex.schema.createTable('employees', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('employee_code', 20).notNullable().unique();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('phone', 30).nullable();
    table.string('department', 100).nullable();
    table.string('position', 100).nullable();
    table
      .enu('status', ['active', 'inactive', 'on_leave'])
      .notNullable()
      .defaultTo('active');
    table.date('hire_date').nullable();
    table.time('expected_check_in').nullable().comment('Expected start time, e.g. 09:00:00');
    table.time('expected_check_out').nullable().comment('Expected end time, e.g. 18:00:00');
    table.timestamps(true, true); // created_at, updated_at

    // Indexes
    table.index('employee_code');
    table.index('email');
    table.index('status');
    table.index('department');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('employees');
};
