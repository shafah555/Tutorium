const { Setting } = require('../models');

async function getOrCreateSettings(userId) {
  let settings = await Setting.findOne({ where: { userId } });
  if (!settings) {
    settings = await Setting.create({ userId });
  }
  return settings;
}

// GET /api/settings
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings(req.user.id);
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

// PUT /api/settings
exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings(req.user.id);

    const fields = [
      'instituteName', 'tutorName', 'phone', 'googleFormLink',
      'receiptFooter', 'currency',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined && req.body[f] !== '') {
        settings[f] = req.body[f];
      }
    });

    if (req.body.monthlyFeeDefault !== undefined && req.body.monthlyFeeDefault !== '') {
      settings.monthlyFeeDefault = parseFloat(req.body.monthlyFeeDefault) || 0;
    }

    if (req.files?.logo?.[0]) {
      settings.logo = `/uploads/${req.files.logo[0].filename}`;
    }
    if (req.files?.signature?.[0]) {
      settings.signature = `/uploads/${req.files.signature[0].filename}`;
    }

    await settings.save();
    res.json({ success: true, message: 'Settings updated successfully.', data: settings });
  } catch (err) {
    next(err);
  }
};

module.exports.getOrCreateSettings = getOrCreateSettings;
