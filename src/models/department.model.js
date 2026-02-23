const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../database/connection');

class Department extends Model {
  toJSON() {
    const values = { ...this.get() };
    delete values.deletedAt;
    return values;
  }
}

Department.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'manager_id',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    modelName: 'Department',
    tableName: 'departments',
    underscored: true,
    paranoid: true, // soft-delete via deletedAt
    timestamps: true,
  },
);

module.exports = Department;
