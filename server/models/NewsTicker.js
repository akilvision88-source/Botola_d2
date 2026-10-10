const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NewsTicker = sequelize.define('news_ticker', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    message: { type: DataTypes.STRING(500), allowNull: false },
    link_url: { type: DataTypes.STRING(500) },
    link_text: { type: DataTypes.STRING(100) },
    icon: { type: DataTypes.STRING(50), defaultValue: 'fa-bullhorn' },
    color: {
      type: DataTypes.ENUM('primary', 'success', 'warning', 'danger', 'info'),
      defaultValue: 'primary'
    },
    display_order: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    starts_at: { type: DataTypes.DATE },
    ends_at: { type: DataTypes.DATE }
  }, { tableName: 'news_ticker' });

  return NewsTicker;
};