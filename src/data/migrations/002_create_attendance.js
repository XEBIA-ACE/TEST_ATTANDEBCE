/**
 * Migration: Create the attendance_records table.
 *
 * Records each check-in/check-out event for an employee.
 * One employee may have at most one open record per calendar day
 * (enforced at the service layer).
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

    table.timestamp('check_in_time', { useTz: true }).notNullable();
    table.timestamp('check_out_time', { useTz: true }).nullable();

    // Decimal hours worked, calculated on check-out
    table.decimal('worked_hours', 5, 2).nullable();

    // Status: checked_in | checked_out | absent
    table.string('status', 20).notNullable().defaultTo('checked_in');

    // Optional notes at check-in and check-out
    table.text('check_in_notes').nullable();
    table.text('check_out_notes').nullable();

    // Location data stored as JSON string (lat, lng, address)
    table.text('check_in_location').nullable();
    table.text('check_out_location').nullable();

    table.timestamps(true, true);

    // Indexes for efficient date-range and employee queries
    table.index('employee_id');
    table.index('check_in_time');
    table.index('status');
    table.index(['employee_id', 'check_in_time']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('attendance_records');
};
