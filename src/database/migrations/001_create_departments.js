/** @type {import('umzug').MigrationFn} */
async function up({ context: queryInterface }) {
  const { DataTypes } = require('sequelize');

  await queryInterface.createTable('departments', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    manager_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'FK to employees.id — set after employees table is created',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await queryInterface.addIndex('departments', ['name'], { unique: true });
  await queryInterface.addIndex('departments', ['is_active']);
}

/** @type {import('umzug').MigrationFn} */
async function down({ context: queryInterface }) {
  await queryInterface.dropTable('departments');
}

module.exports = { up, down };
