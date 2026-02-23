/**
 * Migration: Create the employees table.
 *
 * Stores core employee profile data. Uses UUID primary keys for
 * portability and avoids sequential ID enumeration.
 */
exports.up = async (knex) => {
  await knex.schema.createTable('employees', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('department', 100).notNullable();
    table.string('position', 150).notNullable();
    table.string('employment_type', 50).notNullable().defaultTo('full_time');
    table.string('phone', 20).nullable();
    table.date('hire_date').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);

    // Self-referential manager relationship
    table.uuid('manager_id').nullable().references('id').inTable('employees').onDelete('SET NULL');

    table.timestamps(true, true); // created_at, updated_at

    // Indexes for common query patterns
    table.index('email');
    table.index('department');
    table.index('is_active');
    table.index('manager_id');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('employees');
};
