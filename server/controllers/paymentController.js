const { Op } = require('sequelize');
const { MonthlyPayment, Student, Receipt } = require('../models');
const { generateReceiptNumber } = require('../utils/receiptNumber');
const sequelize = require('../config/database');

// GET /api/payments?studentId=&status=&month=&year=
exports.getPayments = async (req, res, next) => {
  try {
    const { studentId, status, month, year, page = 1, limit = 50 } = req.query;
    const where = {};
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (month) where.month = month;
    if (year) where.year = year;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { rows, count } = await MonthlyPayment.findAndCountAll({
      where,
      include: [{ model: Student, attributes: ['id', 'name', 'rollNo', 'phone'] }],
      order: [['year', 'DESC'], ['month', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/pending/:studentId - list of pending (due/partial) months for a student
exports.getPendingMonths = async (req, res, next) => {
  try {
    const pending = await MonthlyPayment.findAll({
      where: {
        studentId: req.params.studentId,
        status: { [Op.in]: ['due', 'partial'] },
      },
      order: [['year', 'ASC'], ['month', 'ASC']],
    });
    res.json({ success: true, data: pending });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments
// body: { studentId, payments: [{ paymentId, amount }], paymentDate, paymentMethod, notes }
// Receives payment for one or multiple months at once and generates a single receipt.
exports.receivePayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { studentId, payments, paymentDate, paymentMethod, notes } = req.body;

    if (!studentId || !Array.isArray(payments) || payments.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'studentId and payments[] are required.' });
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const receiptNo = await generateReceiptNumber();
    let totalPaid = 0;
    const paidDetails = [];

    for (const p of payments) {
      const record = await MonthlyPayment.findOne({
        where: { id: p.paymentId, studentId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!record) continue;

      const payAmount = Math.min(Number(p.amount), Number(record.dueAmount));
      if (payAmount <= 0) continue;

      record.paidAmount = Number(record.paidAmount) + payAmount;
      record.dueAmount = Number(record.monthlyFee) - Number(record.paidAmount);
      record.status = record.dueAmount <= 0 ? 'paid' : 'partial';
      record.paymentDate = paymentDate || new Date();
      record.paymentMethod = paymentMethod || 'Cash';
      record.receiptNo = receiptNo;
      if (notes) record.notes = notes;
      await record.save({ transaction: t });

      totalPaid += payAmount;
      paidDetails.push({ month: record.month, year: record.year, amount: payAmount });
    }

    if (totalPaid <= 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'No valid payment amounts provided.' });
    }

    const receipt = await Receipt.create({
      receiptNo,
      studentId,
      paymentType: 'tuition',
      details: paidDetails,
      amount: totalPaid,
      paymentMethod: paymentMethod || 'Cash',
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Payment received successfully.',
      data: { receipt, paidDetails, totalPaid },
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// PUT /api/payments/:id - manual edit of a monthly payment record
exports.updatePayment = async (req, res, next) => {
  try {
    const record = await MonthlyPayment.findByPk(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Payment record not found' });

    const fields = ['paidAmount', 'dueAmount', 'status', 'paymentDate', 'paymentMethod', 'notes'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) record[f] = req.body[f];
    });

    await record.save();
    res.json({ success: true, message: 'Payment updated successfully.', data: record });
  } catch (err) {
    next(err);
  }
};
