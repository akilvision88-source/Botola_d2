const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MatchCard = sequelize.define('match_cards', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    match_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    team_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    player_name: { type: DataTypes.STRING(120), allowNull: false },
    card_type: { type: DataTypes.ENUM('yellow','red','second_yellow'), allowNull: false },
    minute: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false }
  }, { tableName: 'match_cards' });

  return MatchCard;
};