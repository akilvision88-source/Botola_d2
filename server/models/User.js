const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('users', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    full_name: { type: DataTypes.STRING(120), allowNull: false },
    email: {
      type: DataTypes.STRING(150), allowNull: false, unique: true,
      validate: { isEmail: true }
    },
    phone: { type: DataTypes.STRING(30) },
    password: { type: DataTypes.STRING(255), allowNull: false },
    avatar: { type: DataTypes.STRING(255) },
    role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    subscription_plan_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    subscription_start: { type: DataTypes.DATE, allowNull: true },
    subscription_end: { type: DataTypes.DATE, allowNull: true },
    subscription_status: {
      type: DataTypes.ENUM('active','expired','cancelled','pending'),
      defaultValue: 'pending'
    },
    status: {
      type: DataTypes.ENUM('active','suspended','inactive'),
      defaultValue: 'active'
    },
    email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    verification_token: { type: DataTypes.STRING(255) },
    reset_token: { type: DataTypes.STRING(255) },
    reset_token_expires: { type: DataTypes.DATE },
    language: { type: DataTypes.ENUM('fr','en','ar'), defaultValue: 'fr' },
    last_login: { type: DataTypes.DATE }
  }, {
    tableName: 'users',
    defaultScope: {
      attributes: { exclude: ['password','verification_token','reset_token'] }
    },
    scopes: {
      withPassword: { attributes: { include: ['password'] } }
    }
  });

  return User;
};