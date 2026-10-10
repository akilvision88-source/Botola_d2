const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('notifications', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED },
    match_id: { type: DataTypes.INTEGER.UNSIGNED },
    type: {
      type: DataTypes.ENUM('match_reminder','subscription','system','admin_broadcast'),
      defaultValue: 'system'
    },
    title: { type: DataTypes.STRING(180), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_broadcast: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'notifications' });

  return Notification;
};