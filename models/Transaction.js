const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ["expense", "income"],
    default: "expense"
  },
  category: {
    type: String,
    required: true
  },
  description: String,
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card", "upi", "netbanking", "bank", "check", "other"],
    default: "cash"
  },
  recurring: {
    type: Boolean,
    default: false
  },
  source: String,
  frequency: String,
  taxDeductible: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

module.exports = mongoose.model("Transaction", transactionSchema)
