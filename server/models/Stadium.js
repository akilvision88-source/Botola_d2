const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Stadium = sequelize.define('stadiums', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    city: { type: DataTypes.STRING(100), allowNull: false },
    capacity: { type: DataTypes.INTEGER.UNSIGNED },
    address: { type: DataTypes.STRING(255) },
    image: { type: DataTypes.STRING(255) }
  }, { tableName: 'stadiums' });

  return Stadium;
};