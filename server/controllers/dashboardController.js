const { Op, fn, col, literal } = require('sequelize');
const { Student, MonthlyPayment, ModelTestPayment } = require('../models');

// GET /api/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const totalStudents = await Student.count();
    const activeStudents = await Student.count({ where: { status: 'active' } });
    const completedStudents = await Student.count({ where: { status: 'completed' } });

    const thisMonthPayments = await MonthlyPayment.findAll({
      where: { month, year },
      attributes: [
        [fn('SUM', col('paidAmount')), 'collected'],
        [fn('SUM', col('dueAmount')), 'due'],
      ],
      raw: true,
    });

    const collectedThisMonth = Number(thisMonthPayments[0]?.collected || 0);
    const dueThisMonth = Number(thisMonthPayments[0]?.due || 0);

    const modelTestPayments = await ModelTestPayment.findAll({
      where: {
        paymentDate: {
          [Op.gte]: new Date(year, month - 1, 1),
          [Op.lt]: new Date(year, month, 1),
        },
      },
      attributes: [[fn('SUM', col('paidAmount')), 'total']],
      raw: true,
    });
    const modelTestCollection = Number(modelTestPayments[0]?.total || 0);

    // Monthly collection chart - last 6 months
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(year, month - 1 - i, 1);
      months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }

    const chartData = await Promise.all(
      months.map(async (m) => {
        const result = await MonthlyPayment.findAll({
          where: { month: m.month, year: m.year },
          attributes: [[fn('SUM', col('paidAmount')), 'collected']],
          raw: true,
        });
        return {
          month: m.month,
          year: m.year,
          collected: Number(result[0]?.collected || 0),
        };
      })
    );

    // Notifications
    const studentsWithDue = await MonthlyPayment.count({
      where: { status: { [Op.in]: ['due', 'partial'] } },
      distinct: true,
      col: 'studentId',
    });

    const todaysPaymentsCount = await MonthlyPayment.count({
      where: {
        paymentDate: new Date().toISOString().slice(0, 10),
      },
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        completedStudents,
        collectedThisMonth,
        dueThisMonth,
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
