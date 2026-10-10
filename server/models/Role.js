const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define('roles', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    slug: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(255) },
    is_system: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'roles' });

  return Role;
};