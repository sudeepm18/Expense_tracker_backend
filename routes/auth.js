const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const User = require("../models/User")
const { sendPasswordResetEmail, sendWelcomeEmail } = require("../config/email")

const router = express.Router()

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" })

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      joinDate: new Date()
    })

    // Send welcome email
    try {
      await sendWelcomeEmail(email, name)
      console.log(`✅ Welcome email sent to ${email}`)
    } catch (emailError) {
      console.error("⚠️ Welcome email sending failed:", emailError.message)
      // Don't fail signup if email fails
    }

    res.json({ msg: "User registered successfully. Check your email!" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user)
      return res.status(400).json({ msg: "Invalid credentials" })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch)
      return res.status(400).json({ msg: "Invalid credentials" })

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        joinDate: user.joinDate,
        language: user.language,
        currency: user.currency,
        timezone: user.timezone
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ msg: "Email is required" })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ msg: "User not found with this email" })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP for storage
    const resetToken = crypto.createHash("sha256").update(otp).digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Save hashed OTP and expiry to user
    user.resetToken = resetToken
    user.resetTokenExpiry = resetTokenExpiry
    await user.save()

    // Send OTP email (send the plain OTP, not the hash)
    try {
      await sendPasswordResetEmail(email, otp)
      console.log(`✅ Password reset email sent to ${email}`)
    } catch (emailError) {
      console.error("⚠️ Email sending failed:", emailError.message)
      // Don't fail the entire request if email fails
      // In production, you might want to handle this differently
    }

    res.json({
      msg: "Check your email for the OTP code",
      email: email
    })
  } catch (err) {
    console.error("❌ Error in forgot-password:", err.message)
    res.status(500).json({ error: err.message })
  }
})

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, resetToken, newPassword, password } = req.body
    const otpCode = otp || resetToken
    const passwordToSet = newPassword || password

    if (!email || !otpCode || !passwordToSet) {
      return res.status(400).json({ msg: "Email, OTP, and new password are required" })
    }

    // Hash the provided OTP to compare with stored hash
    const resetTokenHash = crypto.createHash("sha256").update(otpCode).digest("hex");

    const user = await User.findOne({
      email,
      resetToken: resetTokenHash,
      resetTokenExpiry: { $gt: new Date() }
    })

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired OTP" })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(passwordToSet, 10)

    // Update password and clear reset token
    user.password = hashedPassword
    user.resetToken = null
    user.resetTokenExpiry = null
    await user.save()

    res.json({ msg: "Password reset successfully. Please login with your new password." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// Test email endpoint
router.post("/test-email", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ msg: "Email is required" })
    }

    const { sendWelcomeEmail } = require("../config/email")

    await sendWelcomeEmail(email, "Test User")
    res.json({ msg: "Test email sent successfully" })
  } catch (err) {
    console.error("❌ Test email error:", err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
