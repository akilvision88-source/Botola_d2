const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RolePermission = sequelize.define('role_permissions', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    permission_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }
  }, {
    tableName: 'role_permissions',
    indexes: [{ unique: true, fields: ['role_id', 'permission_id'] }]
  });

  return RolePermission;
};