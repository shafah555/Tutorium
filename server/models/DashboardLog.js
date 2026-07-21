const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DashboardLog = sequelize.define('DashboardLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  meta: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'dashboard_logs',
  timestamps: true,
  updatedAt: false,
});

module.exports = DashboardLog;
