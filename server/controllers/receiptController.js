const { Receipt, Student, Setting } = require('../models');
const { streamReceiptPdf } = require('../utils/receiptPdf');
const { teacherWhere } = require('../utils/teacherScope');
const { getOrCreateSettings } = require('./settingController');

// GET /api/receipt/:id  -> JSON detail
exports.getReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id, {
      include: [{
        model: Student,
        attributes: ['id', 'name', 'rollNo', 'phone', 'userId'],
        where: teacherWhere(req),
        required: true,
      }],
    });
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });

    const settings = await getOrCreateSettings(req.user.id);
    res.json({ success: true, data: { ...receipt.toJSON(), settings } });
  } catch (err) {
    next(err);
  }
};

// GET /api/receipt/pdf/:id -> streams a printable PDF
exports.getReceiptPdf = async (req, res, next) => {
  try {
    const receipt = await Receipt.findByPk(req.params.id, {
      include: [{
        model: Student,
        attributes: ['id', 'name', 'rollNo', 'phone', 'userId'],
        where: teacherWhere(req),
        required: true,
      }],
    });
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });

    const settings = await getOrCreateSettings(req.user.id);
    const uploadsPath = require('path').join(__dirname, '..');

    await streamReceiptPdf({
      res,
      receipt: receipt.toJSON(),
      student: receipt.Student.toJSON(),
      settings: settings.toJSON(),
      uploadsPath,
    });
  } catch (err) {
    // If streamReceiptPdf already started writing the PDF to the response,
    // we can't hand this off to the JSON error handler anymore — that would
    // throw "Cannot set headers after they are sent" and leave the client
    // with a corrupted, half-written PDF instead of a clear error.
    if (res.headersSent) {
      console.error('Error after PDF stream started:', err);
      return res.destroy(err);
    }
    next(err);
  }
};