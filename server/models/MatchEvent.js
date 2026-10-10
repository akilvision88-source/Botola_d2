const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MatchEvent = sequelize.define('match_events', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    match_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    team_id: { type: DataTypes.INTEGER.UNSIGNED },
    event_type: {
      type: DataTypes.ENUM(
        'goal','yellow_card','red_card','substitution',
        'penalty','own_goal','var','kickoff','halftime','fulltime'
      ),
      allowNull: false
    },
    player_name: { type: DataTypes.STRING(120) },
    player_secondary: { type: DataTypes.STRING(120) },
    minute: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
    description: { type: DataTypes.STRING(255) }
  }, { tableName: 'match_events' });

  return MatchEvent;
};