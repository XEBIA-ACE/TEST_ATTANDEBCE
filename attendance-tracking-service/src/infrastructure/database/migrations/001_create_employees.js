'use strict';

/**
 * Migration: Create employees table.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('employees', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.string('employee_number', 50).notNullable().unique();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('department', 100).notNullable();
    table.string('position', 100).notNullable();

    table
      .enum('status', ['active', 'inactive', 'on_leave'])
      .notNullable()
      .defaultTo('active');

    table.date('hire_date').notNullable();

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable(); // Soft delete support
  });

  // Indexes for common query patterns
  await knex.schema.table('employees', (table) => {
    table.index('status');
    table.index('department');
    table.index(['deleted_at']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('employees');
};
