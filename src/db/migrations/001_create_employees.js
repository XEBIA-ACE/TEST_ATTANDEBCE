'use strict';

/**
 * Migration: Create employees table
 *
 * Stores core employee identity and HR information.
 * The `employee_code` is a human-readable unique identifier (e.g. "EMP-001")
 * while `id` (UUID) is the internal primary key used for all joins.
 */
exports.up = function (knex) {
  return knex.schema.createTable('employees', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('employee_code', 20).notNullable().unique().comment('Human-readable code, e.g. EMP-001');
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('phone', 20).nullable();
    table.string('department', 100).nullable();
    table.string('position', 100).nullable();
    table.string('manager_id', 36).nullable().references('id').inTable('employees').onDelete('SET NULL');
    table
      .enu('status', ['active', 'inactive', 'on_leave'])
      .notNullable()
      .defaultTo('active');
    table.date('hire_date').nullable();
    table.string('password_hash', 255).nullable().comment('Hashed password for API auth');
    table.timestamps(true, true); // created_at, updated_at with defaults

    // Indexes for common query patterns
    table.index(['department']);
    table.index(['status']);
    table.index(['email']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('employees');
};
