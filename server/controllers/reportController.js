const { Op, fn, col } = require('sequelize');
const XLSX = require('xlsx');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const { MonthlyPayment, Student, ModelTest, ModelTestPayment } = require('../models');
const { teacherWhere } = require('../utils/teacherScope');

function sendExport(res, filename, rows, format) {
  if (format === 'excel') {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
    return res.send(buffer);
  }

  if (format === 'csv') {
    const parser = new Parser();
    const csv = parser.parse(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
    return res.send(csv);
  }

  if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
    doc.pipe(res);
    doc.fontSize(14).text(filename.replace(/-/g, ' ').toUpperCase(), { align: 'center' });
    doc.moveDown();
    if (rows.length) {
      const headers = Object.keys(rows[0]);
      doc.fontSize(9);
      doc.text(headers.join(' | '));
      doc.moveDown(0.3);
      rows.forEach((r) => {
        doc.text(headers.map((h) => String(r[h] ?? '')).join(' | '));
      });
    } else {
      doc.text('No data available.');
    }
    doc.end();
    return null;
  }

  return res.json({ success: true, data: rows });
}

const studentInclude = (req) => ({
  model: Student,
  attributes: ['name', 'rollNo', 'phone'],
  where: teacherWhere(req),
  required: true,
});

// GET /api/reports/monthly?month=&year=&format=
exports.monthlyCollectionReport = async (req, res, next) => {
  try {
    const { month, year, format = 'json' } = req.query;
    const where = {};
    if (month) where.month = month;
    if (year) where.year = year;

    const payments = await MonthlyPayment.findAll({
      where,
      include: [studentInclude(req)],
      order: [['year', 'DESC'], ['month', 'DESC']],
    });

    const rows = payments.map((p) => ({
      Student: p.Student?.name,
      Roll: p.Student?.rollNo,
      Phone: p.Student?.phone,
      Month: p.month,
      Year: p.year,
      MonthlyFee: p.monthlyFee,
      Paid: p.paidAmount,
      Due: p.dueAmount,
      Status: p.status,
      PaymentDate: p.paymentDate,
    }));

    sendExport(res, 'monthly-collection-report', rows, format);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/due?format=
exports.dueReport = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;
    const payments = await MonthlyPayment.findAll({
      where: { status: { [Op.in]: ['due', 'partial'] } },
      include: [studentInclude(req)],
      order: [['year', 'ASC'], ['month', 'ASC']],
    });

    const rows = payments.map((p) => ({
      Student: p.Student?.name,
      Roll: p.Student?.rollNo,
      Phone: p.Student?.phone,
      Month: p.month,
      Year: p.year,
      Due: p.dueAmount,
      Status: p.status,
    }));

    sendExport(res, 'due-report', rows, format);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/students?format=
exports.studentReport = async (req, res, next) => {
  try {
    const { status, format = 'json' } = req.query;
    const where = teacherWhere(req);
    if (status) where.status = status;

    const students = await Student.findAll({ where, order: [['rollNo', 'ASC']] });
    const rows = students.map((s) => ({
      Roll: s.rollNo,
      Name: s.name,
      Phone: s.phone,
      GuardianPhone: s.guardianPhone,
      Class: s.class,
      Group: s.group,
      HscYear: s.hscYear,
      MonthlyFee: s.monthlyFee,
      Status: s.status,
      JoiningDate: s.joiningDate,
      CompletionDate: s.completionDate,
    }));

    sendExport(res, `student-report${status ? '-' + status : ''}`, rows, format);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/model-tests?format=
exports.modelTestReport = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;
    const payments = await ModelTestPayment.findAll({
      include: [
        { model: Student, attributes: ['name', 'rollNo'], where: teacherWhere(req), required: true },
        { model: ModelTest, attributes: ['title', 'fee'], where: teacherWhere(req), required: true },
      ],
      order: [['paymentDate', 'DESC']],
    });

    const rows = payments.map((p) => ({
      Student: p.Student?.name,
      Roll: p.Student?.rollNo,
      Test: p.ModelTest?.title,
      Fee: p.ModelTest?.fee,
      Paid: p.paidAmount,
      Date: p.paymentDate,
    }));

    sendExport(res, 'model-test-report', rows, format);
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/income?groupBy=month|year&format=
exports.incomeReport = async (req, res, next) => {
  try {
    const { groupBy = 'month', format = 'json' } = req.query;
    const groupFields = groupBy === 'year' ? ['year'] : ['year', 'month'];

    const tuition = await MonthlyPayment.findAll({
      attributes: [
        ...groupFields.map((f) => col(`MonthlyPayment.${f}`)),
        [fn('SUM', col('MonthlyPayment.paidAmount')), 'tuitionCollected'],
      ],
      include: [{ model: Student, attributes: [], where: teacherWhere(req), required: true }],
      group: groupFields.map((f) => `MonthlyPayment.${f}`),
      order: [['year', 'DESC']],
      raw: true,
    });

    const rows = tuition.map((t) => ({
      Year: t.year,
      Month: groupBy === 'year' ? undefined : t.month,
      TuitionCollected: Number(t.tuitionCollected || 0),
    }));

    sendExport(res, `income-report-by-${groupBy}`, rows, format);
  } catch (err) {
    next(err);
  }
};
