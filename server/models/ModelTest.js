const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ModelTest = sequelize.define('ModelTest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  examDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  description: DataTypes.TEXT,
}, {
  tableName: 'model_tests',
  timestamps: true,
});

module.exports = ModelTest;
