const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StandingAdjustment = sequelize.define('standings_adjustments', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    team_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    points_adjustment: { type: DataTypes.INTEGER, defaultValue: 0 },
    played_adjustment: { type: DataTypes.INTEGER, defaultValue: 0 },
    wins_adjustment: { type: DataTypes.INTEGER, defaultValue: 0 },
    draws_adjustment: { type: DataTypes.INTEGER, defaultValue: 0 },
    losses_adjustment: { type: DataTypes.INTEGER, defaultValue: 0 },
    gf_adjustment: { type: DataTypes.INTEGER, defaultValue: 0 },
    ga_adjustment: { type: DataTypes.INTEGER, defaultValue: 0 },
    notes: { type: DataTypes.STRING(255) },
    updated_by: { type: DataTypes.INTEGER.UNSIGNED }
  }, { tableName: 'standings_adjustments' });

  return StandingAdjustment;
};