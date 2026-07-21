const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ModelTestPayment = sequelize.define('ModelTestPayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  testId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  receiptNo: DataTypes.STRING,
}, {
  tableName: 'model_test_payments',
  timestamps: true,
});

module.exports = ModelTestPayment;
