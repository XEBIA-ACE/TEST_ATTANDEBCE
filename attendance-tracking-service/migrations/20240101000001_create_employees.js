/**
 * Migration: Create employees table.
 * Stores core employee profile information.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('employees', (table) => {
    table.uuid('id').primary().notNullable();
    table.string('employee_code', 20).notNullable().unique();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('phone', 20).nullable();
    table.string('department', 100).nullable();
    table.string('position', 100).nullable();
    table.date('hire_date').nullable();
    table
      .enum('status', ['active', 'inactive', 'on_leave'])
      .notNullable()
      .defaultTo('active');
    table.uuid('manager_id').nullable().references('id').inTable('employees').onDelete('SET NULL');
    table.timestamps(true, true);   // created_at, updated_at
    table.timestamp('deleted_at').nullable(); // soft-delete flag

    // Indexes for common query patterns
    table.index(['status']);
    table.index(['department']);
    table.index(['email']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('employees');
};
