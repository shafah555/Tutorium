const { Setting } = require('../models');

// GET /api/settings
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

// PUT /api/settings
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});

    const fields = [
      'instituteName', 'tutorName', 'phone', 'googleFormLink',
      'receiptFooter', 'monthlyFeeDefault', 'currency',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) settings[f] = req.body[f];
    });

    if (req.files?.logo?.[0]) settings.logo = `/uploads/${req.files.logo[0].filename}`;
    if (req.files?.signature?.[0]) settings.signature = `/uploads/${req.files.signature[0].filename}`;

    await settings.save();
    res.json({ success: true, message: 'Settings updated successfully.', data: settings });
  } catch (err) {
    next(err);
  }
};
