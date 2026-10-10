/* =========================================================
   BOTOLA D2 — Setting.js
   ========================================================= */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Setting = sequelize.define('settings', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    setting_key: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true
    },
    setting_value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    setting_group: {
      type: DataTypes.STRING(50),
      defaultValue: 'general'
    }
  }, {
    tableName: 'settings',
    timestamps: true,
    createdAt: false,          // ← لا يوجد created_at في الجدول
    updatedAt: 'updated_at'
  });

  return Setting;
};