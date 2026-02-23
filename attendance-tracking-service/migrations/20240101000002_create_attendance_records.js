/**
 * Migration: Create attendance_records table.
 * Tracks daily check-in / check-out events per employee.
 * One record per employee per calendar day (enforced via unique index).
 */
exports.up = async function (knex) {
  await knex.schema.createTable('attendance_records', (table) => {
    table.uuid('id').primary().notNullable();
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
      .enum('status', ['present', 'absent', 'late', 'half_day', 'on_leave', 'holiday'])
      .notNullable()
      .defaultTo('absent');
    table.float('total_hours').nullable();
    table.string('notes', 500).nullable();
    table.string('location', 255).nullable();
    table.timestamps(true, true);

    // Guarantee one record per employee per day
    table.unique(['employee_id', 'date']);

    // Indexes for frequent filter / join patterns
    table.index(['employee_id']);
    table.index(['date']);
    table.index(['status']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('attendance_records');
};
