const sequelize = require('../config/database');
const User = require('./User');
const Student = require('./Student');
const MonthlyPayment = require('./MonthlyPayment');
const ModelTest = require('./ModelTest');
const ModelTestPayment = require('./ModelTestPayment');
const Receipt = require('./Receipt');
const Setting = require('./Setting');
const DashboardLog = require('./DashboardLog');

// Associations
Student.hasMany(MonthlyPayment, { foreignKey: 'studentId', onDelete: 'CASCADE' });
MonthlyPayment.belongsTo(Student, { foreignKey: 'studentId' });

Student.hasMany(ModelTestPayment, { foreignKey: 'studentId', onDelete: 'CASCADE' });
ModelTestPayment.belongsTo(Student, { foreignKey: 'studentId' });

ModelTest.hasMany(ModelTestPayment, { foreignKey: 'testId', onDelete: 'CASCADE' });
ModelTestPayment.belongsTo(ModelTest, { foreignKey: 'testId' });

Student.hasMany(Receipt, { foreignKey: 'studentId', onDelete: 'CASCADE' });
Receipt.belongsTo(Student, { foreignKey: 'studentId' });

module.exports = {
  sequelize,
  User,
  Student,
  MonthlyPayment,
  ModelTest,
  ModelTestPayment,
  Receipt,
  Setting,
  DashboardLog,
};
