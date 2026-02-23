/**
 * Migration: Create users table for API authentication.
 * Decoupled from employees — a user account may map to an employee or be a
 * standalone admin/manager account.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().notNullable();
    table.string('username', 100).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.enum('role', ['admin', 'manager', 'employee']).notNullable().defaultTo('employee');
    table.uuid('employee_id').nullable().references('id').inTable('employees').onDelete('SET NULL');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('last_login_at').nullable();
    table.timestamps(true, true);

    table.index(['email']);
    table.index(['role']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('users');
};
