/* =========================================================
   BOTOLA D2 — models/AdminNotification.js
   ========================================================= */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminNotification = sequelize.define('admin_notifications', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    type: {
      type: DataTypes.ENUM(
        'new_user', 'new_subscription', 'new_payment', 'payment_completed',
        'new_message', 'new_replay', 'system'
      ),
      allowNull: false
    },
    title: { type: DataTypes.STRING(200), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      get() {
        const v = this.getDataValue('data');
        if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
        return v;
      }
    },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_seen: { type: DataTypes.BOOLEAN, defaultValue: false },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal'
    }
  }, {
    tableName: 'admin_notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['is_read'] },
      { fields: ['created_at'] },
      { fields: ['type'] }
    ]
  });

  return AdminNotification;
};