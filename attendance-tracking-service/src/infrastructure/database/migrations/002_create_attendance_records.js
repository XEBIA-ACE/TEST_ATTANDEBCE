'use strict';

/**
 * Migration: Create attendance_records table.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('attendance_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table
      .uuid('employee_id')
      .notNullable()
      .references('id')
      .inTable('employees')
      .onDelete('CASCADE');

    table.date('date').notNullable();
    table.timestamp('check_in').nullable();
    table.timestamp('check_out').nullable();

    table
      .enum('status', ['present', 'absent', 'late', 'half_day', 'on_leave'])
      .notNullable()
      .defaultTo('absent');

    // Total hours worked (computed when checking out)
    table.decimal('total_hours', 5, 2).nullable();
    table.text('notes').nullable();

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // One record per employee per day
    table.unique(['employee_id', 'date']);
  });

  // Indexes for report queries
  await knex.schema.table('attendance_records', (table) => {
    table.index('employee_id');
    table.index('date');
    table.index('status');
    table.index(['employee_id', 'date']);
    table.index(['date', 'status']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('attendance_records');
};
