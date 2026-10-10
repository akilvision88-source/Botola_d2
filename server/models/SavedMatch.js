const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SavedMatch = sequelize.define('saved_matches', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    match_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    notify: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'saved_matches',
    indexes: [{ unique: true, fields: ['user_id','match_id'] }]
  });

  return SavedMatch;
};