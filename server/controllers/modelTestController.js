const { ModelTest, ModelTestPayment, Student, Receipt } = require('../models');
const { generateReceiptNumber } = require('../utils/receiptNumber');
const { teacherWhere } = require('../utils/teacherScope');
const sequelize = require('../config/database');

// GET /api/model-tests
exports.getModelTests = async (req, res, next) => {
  try {
    const tests = await ModelTest.findAll({
      where: teacherWhere(req),
      order: [['examDate', 'DESC']],
    });
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
    const test = await ModelTest.create({
      userId: req.user.id,
      title,
      examDate,
      fee,
      description,
    });
    res.status(201).json({ success: true, message: 'Model test created.', data: test });
  } catch (err) {
    next(err);
  }
};

// PUT /api/model-tests/:id
exports.updateModelTest = async (req, res, next) => {
  try {
    const test = await ModelTest.findOne({ where: teacherWhere(req, { id: req.params.id }) });
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
    const test = await ModelTest.findOne({ where: teacherWhere(req, { id: req.params.id }) });
    if (!test) return res.status(404).json({ success: false, message: 'Model test not found' });
    await test.destroy();
    res.json({ success: true, message: 'Model test deleted.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/model-tests/:id/students?class=&hscYear=&paymentStatus=paid|due
// Returns every student (scoped to the teacher, optionally filtered by
// class/HSC year) alongside whether they've paid for this specific model
// test, so a teacher can see paid/due status test-by-test.
exports.getModelTestStudents = async (req, res, next) => {
  try {
    const test = await ModelTest.findOne({ where: teacherWhere(req, { id: req.params.id }) });
    if (!test) return res.status(404).json({ success: false, message: 'Model test not found' });

    const { class: className, hscYear, paymentStatus } = req.query;

    const where = teacherWhere(req);
    if (className) where.class = className;
    if (hscYear) where.hscYear = hscYear;

    const students = await Student.findAll({
      where,
      attributes: ['id', 'name', 'rollNo', 'class', 'group', 'hscYear', 'phone', 'status'],
      order: [['name', 'ASC']],
    });

    const payments = students.length
      ? await ModelTestPayment.findAll({
        where: { testId: test.id, studentId: students.map((s) => s.id) },
      })
      : [];
    const paymentByStudent = new Map(payments.map((p) => [p.studentId, p]));

    let data = students.map((s) => {
      const payment = paymentByStudent.get(s.id);
      return {
        id: s.id,
        name: s.name,
        rollNo: s.rollNo,
        class: s.class,
        group: s.group,
        hscYear: s.hscYear,
        phone: s.phone,
        studentStatus: s.status,
        paid: !!payment,
        paidAmount: payment ? payment.paidAmount : null,
        paymentDate: payment ? payment.paymentDate : null,
        receiptNo: payment ? payment.receiptNo : null,
      };
    });

    if (paymentStatus === 'paid') data = data.filter((s) => s.paid);
    if (paymentStatus === 'due') data = data.filter((s) => !s.paid);

    res.json({
      success: true,
      data: {
        test,
        students: data,
        summary: {
          total: data.length,
          paid: data.filter((s) => s.paid).length,
          due: data.filter((s) => !s.paid).length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/model-tests/:id/pay  { studentId, amount, paymentDate }
exports.payModelTest = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { studentId, amount, paymentDate } = req.body;
    const test = await ModelTest.findOne({ where: teacherWhere(req, { id: req.params.id }) });
    if (!test) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Model test not found' });
    }
    const student = await Student.findOne({ where: teacherWhere(req, { id: studentId }) });
    if (!student) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const receiptNo = await generateReceiptNumber(req.user.id);

    const payment = await ModelTestPayment.create({
      studentId: student.id,
      testId: test.id,
      paidAmount: amount,
      paymentDate: paymentDate || new Date(),
      receiptNo,
    }, { transaction: t });

    const receipt = await Receipt.create({
      receiptNo,
      studentId: student.id,
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