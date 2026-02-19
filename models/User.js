const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  location: String,
  joinDate: Date,
  resetToken: String,
  resetTokenExpiry: Date,
  language: String,
  currency: String,
  timezone: String,
  monthlyBudget: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true })

module.exports = mongoose.model("User", userSchema)
