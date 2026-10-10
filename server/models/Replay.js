/* =========================================================
   BOTOLA D2 — models/Replay.js
   Replay model (Full + Summary + Pre-roll Ad)
   ========================================================= */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Replay = sequelize.define('replays', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    match_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    thumbnail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    /* ─────────────── FULL REPLAY ─────────────── */
    video_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    download_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    duration: {
      type: DataTypes.STRING(20),
      allowNull: true
    },

    /* ─────────── SUMMARY / RESUME ─────────── */
    summary_video_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    summary_download_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    summary_duration: {
      type: DataTypes.STRING(20),
      allowNull: true
    },

    /* ─────────── ✅ PRE-ROLL AD ─────────── */
    ad_video_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    ad_duration: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
      defaultValue: 15
    },
    ad_skip_after: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
      defaultValue: 5
    },

    /* ─────────────── META ─────────────── */
    replay_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    views: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0
    },
    requires_subscription: {
      type: DataTypes.ENUM('free', 'standard', 'gold'),
      allowNull: true,
      defaultValue: 'standard'
    }
  }, {
    tableName: 'replays',
    indexes: [
      { fields: ['replay_date'] },
      { fields: ['requires_subscription'] }
    ]
  });

  return Replay;
};