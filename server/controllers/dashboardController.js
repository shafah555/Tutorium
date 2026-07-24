const { Op, fn, col } = require('sequelize');
const { Student, MonthlyPayment, ModelTestPayment } = require('../models');
const { teacherWhere } = require('../utils/teacherScope');

// GET /api/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const studentScope = teacherWhere(req);

    const totalStudents = await Student.count({ where: studentScope });
    const activeStudents = await Student.count({ where: { ...studentScope, status: 'active' } });
    const completedStudents = await Student.count({ where: { ...studentScope, status: 'completed' } });

    const thisMonthPayments = await MonthlyPayment.findAll({
      where: { month, year },
      include: [{ model: Student, attributes: [], where: studentScope, required: true }],
      attributes: [
        [fn('SUM', col('MonthlyPayment.paidAmount')), 'collected'],
        [fn('SUM', col('MonthlyPayment.dueAmount')), 'due'],
      ],
      raw: true,
    });

    const collectedThisMonth = Number(thisMonthPayments[0]?.collected || 0);
    const dueThisMonth = Number(thisMonthPayments[0]?.due || 0);

    // Total outstanding balance across ALL months (not just the current one),
    // for the "Total Due" dashboard card.
    const totalDueResult = await MonthlyPayment.findAll({
      where: { status: { [Op.in]: ['due', 'partial'] } },
      include: [{ model: Student, attributes: [], where: studentScope, required: true }],
      attributes: [[fn('SUM', col('MonthlyPayment.dueAmount')), 'totalDue']],
      raw: true,
    });
    const totalDue = Number(totalDueResult[0]?.totalDue || 0);

    const modelTestPayments = await ModelTestPayment.findAll({
      where: {
        paymentDate: {
          [Op.gte]: new Date(year, month - 1, 1),
          [Op.lt]: new Date(year, month, 1),
        },
      },
      include: [{ model: Student, attributes: [], where: studentScope, required: true }],
      attributes: [[fn('SUM', col('ModelTestPayment.paidAmount')), 'total']],
      raw: true,
    });
    const modelTestCollection = Number(modelTestPayments[0]?.total || 0);

    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(year, month - 1 - i, 1);
      months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }

    const chartData = await Promise.all(
      months.map(async (m) => {
        const result = await MonthlyPayment.findAll({
          where: { month: m.month, year: m.year },
          include: [{ model: Student, attributes: [], where: studentScope, required: true }],
          attributes: [[fn('SUM', col('MonthlyPayment.paidAmount')), 'collected']],
          raw: true,
        });
        return {
          month: m.month,
          year: m.year,
          collected: Number(result[0]?.collected || 0),
        };
      })
    );

    const studentsWithDue = await MonthlyPayment.count({
      where: { status: { [Op.in]: ['due', 'partial'] } },
      include: [{ model: Student, attributes: [], where: studentScope, required: true }],
      distinct: true,
      col: 'studentId',
    });

    const todaysPaymentsCount = await MonthlyPayment.count({
      where: { paymentDate: new Date().toISOString().slice(0, 10) },
      include: [{ model: Student, attributes: [], where: studentScope, required: true }],
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        completedStudents,
        collectedThisMonth,
        dueThisMonth,
        totalDue,
        modelTestCollection,
        monthlyCollectionChart: chartData,
        notifications: {
          studentsWithDue,
          todaysPaymentsCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};