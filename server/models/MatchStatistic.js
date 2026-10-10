const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MatchStatistic = sequelize.define('match_statistics', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    match_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    possession_home: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    possession_away: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    shots_home: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    shots_away: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    shots_on_target_home: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    shots_on_target_away: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    corners_home: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    corners_away: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    fouls_home: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    fouls_away: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    offsides_home: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 },
    offsides_away: { type: DataTypes.SMALLINT.UNSIGNED, defaultValue: 0 }
  }, { tableName: 'match_statistics' });

  return MatchStatistic;
};