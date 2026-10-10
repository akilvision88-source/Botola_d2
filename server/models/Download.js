const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Download = sequelize.define('downloads', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    replay_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    ip_address: { type: DataTypes.STRING(45) }
  }, { tableName: 'downloads' });

  return Download;
};