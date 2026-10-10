const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SubscriptionPlan = sequelize.define('subscription_plans', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(60), allowNull: false },
    slug: { type: DataTypes.STRING(60), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(255) },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: 'MAD' },
    duration_days: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 30 },
    features: {
      type: DataTypes.JSON,
      defaultValue: [],
      get() {
        const v = this.getDataValue('features');
        if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
        return v || [];
      }
    },
    live_access: { type: DataTypes.BOOLEAN, defaultValue: false },
    replay_access: { type: DataTypes.BOOLEAN, defaultValue: false },
    download_access: { type: DataTypes.BOOLEAN, defaultValue: false },
    hd_access: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    display_order: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 }
  }, { tableName: 'subscription_plans' });

  return SubscriptionPlan;
};