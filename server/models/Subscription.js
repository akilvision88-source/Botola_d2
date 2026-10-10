const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('subscriptions', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    plan_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING(10), defaultValue: 'MAD' },
    payment_method: { type: DataTypes.STRING(50) },
    payment_reference: { type: DataTypes.STRING(120) },
    status: {
      type: DataTypes.ENUM('pending','active','expired','cancelled','refunded'),
      defaultValue: 'pending'
    },
    start_date: { type: DataTypes.DATE, allowNull: false },
    end_date: { type: DataTypes.DATE, allowNull: false }
  }, { tableName: 'subscriptions' });

  return Subscription;
};