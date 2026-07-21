const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Receipt = sequelize.define('Receipt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  receiptNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  paymentType: {
    type: DataTypes.ENUM('tuition', 'model_test'),
    allowNull: false,
  },
  // JSON list of {month, year, amount} for tuition, or {testId, title, amount} for model test
  details: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  paymentMethod: DataTypes.STRING,
}, {
  tableName: 'payment_receipts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Receipt;
