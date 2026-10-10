const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Team = sequelize.define('teams', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    short_name: { type: DataTypes.STRING(20) },
    slug: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    logo: { type: DataTypes.STRING(255) },
    city: { type: DataTypes.STRING(100) },
    stadium_id: { type: DataTypes.INTEGER.UNSIGNED },
    description: { type: DataTypes.TEXT },
    founded_year: { type: DataTypes.SMALLINT },
    status: { type: DataTypes.ENUM('active','inactive'), defaultValue: 'active' }
  }, { tableName: 'teams' });

  return Team;
};