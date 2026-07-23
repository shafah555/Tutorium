const { Op } = require('sequelize');
const { Student, MonthlyPayment } = require('../models');
const { generateRollNumber } = require('../utils/rollNumber');
const { generatePayableMonths } = require('../utils/monthGenerator');
const { teacherWhere } = require('../utils/teacherScope');
const sequelize = require('../config/database');

async function findTeacherStudent(req, id) {
  return Student.findOne({ where: teacherWhere(req, { id }) });
}

// GET /api/students?search=&status=&class=&group=&hscYear=&page=&limit=
exports.getStudents = async (req, res, next) => {
  try {
    const {
      search, status, class: className, group, hscYear,
      page = 1, limit = 20,
    } = req.query;

    const where = teacherWhere(req);
    if (status) where.status = status;
    if (className) where.class = className;
    if (group) where.group = group;
    if (hscYear) where.hscYear = hscYear;

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { rollNo: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { guardianPhone: { [Op.iLike]: `%${search}%` } },
        { school: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const { rows, count } = await Student.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/students/:id
exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findOne({
      where: teacherWhere(req, { id: req.params.id }),
      include: [{ model: MonthlyPayment }],
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

// POST /api/students
exports.createStudent = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const {
      name, fatherName, motherName, phone, guardianPhone, school,
      class: className, group, hscYear, address, joiningDate,
      monthlyFee, notes,
    } = req.body;

    if (!name || !phone || !hscYear || !joiningDate || monthlyFee === undefined) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'name, phone, hscYear, joiningDate and monthlyFee are required.',
      });
    }

    const existingPhone = await Student.findOne({
      where: teacherWhere(req, { phone }),
    });

    const rollNo = await generateRollNumber(hscYear, req.user.id);

    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const student = await Student.create({
      userId: req.user.id,
      rollNo,
      name,
      fatherName,
      motherName,
      phone,
      guardianPhone,
      school,
      class: className,
      group,
      hscYear,
      address,
      joiningDate,
      monthlyFee,
      notes,
      photo,
      status: 'active',
    }, { transaction: t });

    const months = generatePayableMonths(joiningDate);
    const paymentRows = months.map((m) => ({
      studentId: student.id,
      month: m.month,
      year: m.year,
      monthlyFee,
      paidAmount: 0,
      dueAmount: monthlyFee,
      status: 'due',
    }));
    if (paymentRows.length) {
      await MonthlyPayment.bulkCreate(paymentRows, { transaction: t });
    }

    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Student created successfully.',
      duplicatePhoneWarning: !!existingPhone,
      data: student,
    });
  } catch (err) {
    await t.rollback();
    next(err);
  }
};

// PUT /api/students/:id
exports.updateStudent = async (req, res, next) => {
  try {
    const student = await findTeacherStudent(req, req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const fields = [
      'name', 'fatherName', 'motherName', 'phone', 'guardianPhone', 'school',
      'class', 'group', 'hscYear', 'address', 'joiningDate', 'monthlyFee',
      'notes', 'status',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) student[f] = req.body[f];
    });

    if (req.file) {
      student.photo = `/uploads/${req.file.filename}`;
    }

    await student.save();
    res.json({ success: true, message: 'Student updated successfully.', data: student });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/students/:id
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await findTeacherStudent(req, req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    await student.destroy();
    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/students/:id/complete  { completionDate }
exports.completeStudent = async (req, res, next) => {
  try {
    const { completionDate } = req.body;
    if (!completionDate) {
      return res.status(400).json({ success: false, message: 'completionDate is required.' });
    }

    const student = await findTeacherStudent(req, req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    student.status = 'completed';
    student.completionDate = completionDate;
    await student.save();

    const completion = new Date(completionDate);
    const cMonth = completion.getMonth() + 1;
    const cYear = completion.getFullYear();

    await MonthlyPayment.destroy({
      where: {
        studentId: student.id,
        paidAmount: 0,
        [Op.or]: [
          { year: { [Op.gt]: cYear } },
          { year: cYear, month: { [Op.gt]: cMonth } },
        ],
      },
    });

    res.json({ success: true, message: 'Student marked as completed.', data: student });
  } catch (err) {
    next(err);
  }
};
