const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'users', key: 'id' },
  },
  instituteName: {
    type: DataTypes.STRING,
    defaultValue: 'Tutorium',
  },
  tutorName: DataTypes.STRING,
  phone: DataTypes.STRING,
  logo: DataTypes.STRING,
  signature: DataTypes.STRING,
  googleFormLink: DataTypes.STRING,
  receiptFooter: DataTypes.TEXT,
  monthlyFeeDefault: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'BDT',
  },
}, {
  tableName: 'settings',
  timestamps: true,
});

module.exports = Setting;
