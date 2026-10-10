const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HomeSection = sequelize.define('home_sections', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    section_key: {
      type: DataTypes.ENUM('live', 'replay', 'upcoming', 'results', 'standings'),
      allowNull: false,
      unique: true
    },
    title: { type: DataTypes.STRING(120) },
    subtitle: { type: DataTypes.STRING(200) },
    is_visible: { type: DataTypes.BOOLEAN, defaultValue: true },
    display_order: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
    items_limit: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 8 },
    view_all_url: { type: DataTypes.STRING(200) },
    view_all_text: { type: DataTypes.STRING(100) }
  }, { tableName: 'home_sections' });

  return HomeSection;
};