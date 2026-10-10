const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('payments', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    plan_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING(10), defaultValue: 'MAD' },
    payment_method: {
      type: DataTypes.ENUM('visa', 'mastercard', 'paypal', 'wafacash', 'cashplus'),
      allowNull: false
    },
    payment_reference: { type: DataTypes.STRING(255) },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    invoice_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    paid_at: { type: DataTypes.DATE }
  }, {
    tableName: 'payments',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['invoice_number'] }
    ]
  });

  return Payment;
};