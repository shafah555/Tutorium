const { Receipt, Student, Setting } = require('../models');
const { streamReceiptPdf } = require('../utils/receiptPdf');

// GET /api/receipt/:id  -> JSON detail
exports.getReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id, {
      include: [{ model: Student, attributes: ['id', 'name', 'rollNo', 'phone'] }],
    });
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    res.json({ success: true, data: receipt });
  } catch (err) {
    next(err);
  }
};

// GET /api/receipt/pdf/:id -> streams a printable PDF
exports.getReceiptPdf = async (req, res, next) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id, { raw: true });
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });

    const student = await Student.findByPk(receipt.studentId, { raw: true });
    const settings = await Setting.findOne({ raw: true });

    await streamReceiptPdf({ res, receipt, student, settings });
  } catch (err) {
    next(err);
  }
};
