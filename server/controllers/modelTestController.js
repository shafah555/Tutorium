const { ModelTest, ModelTestPayment, Student, Receipt } = require('../models');
const { generateReceiptNumber } = require('../utils/receiptNumber');
const sequelize = require('../config/database');

// GET /api/model-tests
exports.getModelTests = async (req, res, next) => {
  try {
    const tests = await ModelTest.findAll({ order: [['examDate', 'DESC']] });
    res.json({ success: true, data: tests });
  } catch (err) {
    next(err);
  }
};

// POST /api/model-tests
exports.createModelTest = async (req, res, next) => {
  try {
    const { title, examDate, fee, description } = req.body;
    if (!title || fee === undefined) {
      return res.status(400).json({ success: false, message: 'title and fee are required.' });
    }
    const test = await ModelTest.create({ title, examDate, fee, description });
    res.status(201).json({ success: true, message: 'Model test created.', data: test });
  } catch (err) {
    next(err);
  }
};

// PUT /api/model-tests/:id
exports.updateModelTest = async (req, res, next) => {
  try {
    const test = await ModelTest.findByPk(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Model test not found' });
    ['title', 'examDate', 'fee', 'description'].forEach((f) => {
      if (req.body[f] !== undefined) test[f] = req.body[f];
    });
    await test.save();
    res.json({ success: true, message: 'Model test updated.', data: test });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/model-tests/:id
exports.deleteModelTest = async (req, res, next) => {
  try {
    const test = await ModelTest.findByPk(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Model test not found' });
    await test.destroy();
    res.json({ success: true, message: 'Model test deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/model-tests/:id/pay  { studentId, amount, paymentDate }
exports.payModelTest = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { studentId, amount, paymentDate } = req.body;
    const test = await ModelTest.findByPk(req.params.id);
    if (!test) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Model test not found' });
    }
    const student = await Student.findByPk(studentId);
    if (!student) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const receiptNo = await generateReceiptNumber();

    const payment = await ModelTestPayment.create({
      studentId,
      testId: test.id,
      paidAmount: amount,
      paymentDate: paymentDate || new Date(),
      receiptNo,
    }, { transaction: t });

    const receipt = await Receipt.create({
      receiptNo,
      studentId,
      paymentType: 'model_test',
      details: { testId: test.id, title: test.title },
      amount,
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ success: true, message: 'Model test payment received.', data: { payment, receipt } });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};
