const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Setting } = require('../models');
const { generateOtp } = require('../utils/otp');
const { sendEmail } = require('../helpers/mailer');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, phone: user.phone },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register  — each teacher gets their own isolated account
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        message: 'Name, password, and at least one of email or phone are required.',
      });
    }

    const { Op } = require('sequelize');
    const orConditions = [];
    if (email) orConditions.push({ email });
    if (phone) orConditions.push({ phone });
    const duplicate = await User.findOne({ where: { [Op.or]: orConditions } });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email or phone already exists. Please log in instead.',
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, password: hashed });

    await Setting.create({
      userId: user.id,
      instituteName: `${name}'s Institute`,
      tutorName: name,
      phone: phone || '',
    });

    const token = signToken(user);
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body; // identifier = email or phone
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password are required.' });
    }

    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: { [Op.or]: [{ email: identifier }, { phone: identifier }] },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user);
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/forgot-password  { identifier }
exports.forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: { [Op.or]: [{ email: identifier }, { phone: identifier }] },
    });

    // Always respond success (avoid user enumeration) but only send OTP if found
    if (user) {
      const otp = generateOtp();
      user.otpCode = otp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: 'Tutorium - Password Reset OTP',
          html: `<p>Your OTP code is <b>${otp}</b>. It expires in 10 minutes.</p>`,
        });
      }
      // NOTE: integrate an SMS provider in utils/otp.js or here to send via phone.
    }

    res.json({ success: true, message: 'If the account exists, an OTP has been sent.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/reset-password  { identifier, otp, newPassword }
exports.resetPassword = async (req, res, next) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: { [Op.or]: [{ email: identifier }, { phone: identifier }] },
    });

    if (!user || !user.otpCode || user.otpCode !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({ success: true, message: 'Password has been reset. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'phone', 'emailVerified', 'phoneVerified'],
    });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
