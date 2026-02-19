const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../config/email');
const bcrypt = require('bcryptjs');

// @desc    Forgot Password Initialization
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found with this email" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP and save to database (using fields matching User model)
    user.resetToken = crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');

    // Set expire (15 minutes)
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;

    await user.save();

    try {
      await sendPasswordResetEmail(user.email, otp);

      res.status(200).json({ success: true, data: "OTP sent to email" });
    } catch (err) {
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;

      await user.save();

      return res.status(500).json({ success: false, error: "Email could not be sent" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  const { email, otp, resetToken, password, newPassword } = req.body;
  const otpCode = otp || resetToken;
  const passwordToSet = password || newPassword;

  if (!otpCode) {
    return res.status(400).json({ success: false, error: "OTP is required" });
  }

  const resetTokenHash = crypto
    .createHash('sha256')
    .update(otpCode)
    .digest('hex');

  try {
    const user = await User.findOne({
      email,
      resetToken: resetTokenHash,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid or expired OTP" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(passwordToSet, salt);

    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.status(200).json({ success: true, data: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};