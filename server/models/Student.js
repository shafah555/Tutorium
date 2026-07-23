const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  rollNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fatherName: DataTypes.STRING,
  motherName: DataTypes.STRING,
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  guardianPhone: DataTypes.STRING,
  school: DataTypes.STRING,
  class: DataTypes.STRING,
  group: DataTypes.STRING,
  hscYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  address: DataTypes.TEXT,
  joiningDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  completionDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  monthlyFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'inactive'),
    defaultValue: 'active',
  },
  photo: DataTypes.STRING,
  notes: DataTypes.TEXT,
}, {
  tableName: 'students',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'rollNo'] },
  ],
});

module.exports = Student;
