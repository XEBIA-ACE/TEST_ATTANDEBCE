/**
 * Migration: Create attendance_records table.
 * A unique constraint on (employee_id, date) enforces one record per employee per day.
 */
exports.up = async function (knex) {
  await knex.schema.createTable('attendance_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('employee_id').notNullable().references('id').inTable('employees').onDelete('RESTRICT');
    table.date('date').notNullable();
    table.timestamp('check_in').notNullable();
    table.timestamp('check_out').nullable();
    table
      .enum('status', ['present', 'absent', 'late', 'half_day', 'on_leave'])
      .notNullable()
      .defaultTo('present');
    table.text('notes').nullable();
    table.timestamps(true, true);

    // One attendance record per employee per calendar day
    table.unique(['employee_id', 'date']);

    // Indexes for common query/reporting patterns
    table.index(['employee_id']);
    table.index(['date']);
    table.index(['status']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('attendance_records');
};
