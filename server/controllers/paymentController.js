const { Op } = require('sequelize');
const { MonthlyPayment, Student, Receipt } = require('../models');
const { generateReceiptNumber } = require('../utils/receiptNumber');
const { teacherWhere } = require('../utils/teacherScope');
const sequelize = require('../config/database');

async function findTeacherStudent(req, studentId) {
  return Student.findOne({ where: teacherWhere(req, { id: studentId }) });
}

// GET /api/payments?studentId=&status=&month=&year=
exports.getPayments = async (req, res, next) => {
  try {
    const { studentId, status, month, year, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (month) where.month = month;
    if (year) where.year = year;

    const studentWhere = teacherWhere(req);
    if (studentId) studentWhere.id = studentId;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { rows, count } = await MonthlyPayment.findAndCountAll({
      where,
      include: [{
        model: Student,
        attributes: ['id', 'name', 'rollNo', 'phone'],
        where: studentWhere,
        required: true,
      }],
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

// GET /api/payments/pending/:studentId
exports.getPendingMonths = async (req, res, next) => {
  try {
    const student = await findTeacherStudent(req, req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const pending = await MonthlyPayment.findAll({
      where: {
        studentId: student.id,
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
exports.receivePayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { studentId, payments, paymentDate, paymentMethod, notes } = req.body;

    if (!studentId || !Array.isArray(payments) || payments.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'studentId and payments[] are required.' });
    }

    const student = await findTeacherStudent(req, studentId);
    if (!student) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const receiptNo = await generateReceiptNumber(req.user.id);
    let totalPaid = 0;
    const paidDetails = [];

    for (const p of payments) {
      const record = await MonthlyPayment.findOne({
        where: { id: p.paymentId, studentId: student.id },
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
      studentId: student.id,
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

// DELETE /api/payments/:id
// Reverses a received payment for this month back to "due". We intentionally
// don't delete the MonthlyPayment row itself — it represents that student's
// scheduled fee for that month, and other months can share the same
// receiptNo, so hard-deleting it would corrupt the ledger. This effectively
// undoes the payment so it can be re-recorded correctly.
exports.deletePayment = async (req, res, next) => {
  try {
    const record = await MonthlyPayment.findByPk(req.params.id, {
      include: [{ model: Student, where: teacherWhere(req), required: true }],
    });
    if (!record) return res.status(404).json({ success: false, message: 'Payment record not found' });

    record.paidAmount = 0;
    record.dueAmount = record.monthlyFee;
    record.status = 'due';
    record.paymentDate = null;
    record.paymentMethod = null;
    record.receiptNo = null;
    record.notes = null;
    await record.save();

    res.json({ success: true, message: 'Payment removed and month marked as due again.', data: record });
  } catch (err) {
    next(err);
  }
};

// PUT /api/payments/:id
exports.updatePayment = async (req, res, next) => {
  try {
    const record = await MonthlyPayment.findByPk(req.params.id, {
      include: [{ model: Student, where: teacherWhere(req), required: true }],
    });
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