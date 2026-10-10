const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MatchGoal = sequelize.define('match_goals', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    match_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    team_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    player_name: { type: DataTypes.STRING(120), allowNull: false },
    minute: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    is_penalty: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_own_goal: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, { tableName: 'match_goals' });

  return MatchGoal;
};