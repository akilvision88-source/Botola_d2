const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Match = sequelize.define('matches', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    competition: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'Botola D2' },
    team_home_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    team_away_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    score_home: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    score_away: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    match_minute: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM('upcoming','live','halftime','finished','postponed','cancelled'),
      defaultValue: 'upcoming'
    },
    stadium_id: { type: DataTypes.INTEGER.UNSIGNED },
    city: { type: DataTypes.STRING(100) },
    referee: { type: DataTypes.STRING(120) },
    match_date: { type: DataTypes.DATEONLY, allowNull: false },
    match_time: { type: DataTypes.TIME, allowNull: false },
    stream_url: { type: DataTypes.STRING(500) },
    thumbnail: { type: DataTypes.STRING(255) },

    // ✅ صورة خلفية للبطاقة
    card_background: { type: DataTypes.STRING(500) },

    // ✅ PRE-ROLL AD
    ad_video_url: { type: DataTypes.STRING(500), allowNull: true },
    ad_duration: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 15 },
    ad_skip_after: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 5 },

    round: { type: DataTypes.STRING(50) },
    attendance: { type: DataTypes.INTEGER.UNSIGNED },
    created_by: { type: DataTypes.INTEGER.UNSIGNED }
  }, {
    tableName: 'matches',
    indexes: [
      { fields: ['status'] },
      { fields: ['match_date'] },
      { fields: ['team_home_id','team_away_id'] }
    ]
  });

  return Match;
};