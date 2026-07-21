const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MonthlyPayment = sequelize.define('MonthlyPayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  month: {
    // 1-12
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  monthlyFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  dueAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('paid', 'partial', 'due'),
    defaultValue: 'due',
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  receiptNo: DataTypes.STRING,
  notes: DataTypes.TEXT,
}, {
  tableName: 'monthly_payments',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['studentId', 'month', 'year'] },
  ],
});

module.exports = MonthlyPayment;
