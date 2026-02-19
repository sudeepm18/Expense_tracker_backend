const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get user profile by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      joinDate: user.joinDate,
      language: user.language,
      currency: user.currency,
      timezone: user.timezone,
      monthlyBudget: user.monthlyBudget
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, location, language, currency, timezone, monthlyBudget } = req.body;
    
    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, location, language, currency, timezone, monthlyBudget },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      msg: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        joinDate: user.joinDate,
        language: user.language,
        currency: user.currency,
        timezone: user.timezone,
        monthlyBudget: user.monthlyBudget
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update password
router.put("/update-password/:id", authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ msg: "Password required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(req.params.id, {
      password: hashedPassword,
    });

    res.json({ msg: "Password updated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
