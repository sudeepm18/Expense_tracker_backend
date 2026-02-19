const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get all incomes for a user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.id,
      type: "income"
    }).sort({ date: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single income
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
      type: "income"
    });

    if (!transaction) {
      return res.status(404).json({ msg: "Income record not found" });
    }

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new income
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, amount, category, description, date, source, paymentMethod, recurring, frequency, taxDeductible } = req.body;

    // Validation
    if (!title || !amount || !category) {
      return res.status(400).json({ msg: "Title, amount, and category are required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ msg: "Amount must be greater than 0" });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      title,
      amount: parseFloat(amount),
      type: "income",
      category,
      description: description || "",
      date: date ? new Date(date) : new Date(),
      source: source || "",
      paymentMethod: paymentMethod || "bank",
      recurring: recurring || false,
      frequency: frequency || "one-time",
      taxDeductible: taxDeductible || false
    });

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update income
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, amount, category, description, date, source, paymentMethod, recurring, frequency, taxDeductible } = req.body;

    if (amount && amount <= 0) {
      return res.status(400).json({ msg: "Amount must be greater than 0" });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, type: "income" },
      {
        title,
        amount: amount ? parseFloat(amount) : undefined,
        category,
        description,
        date: date ? new Date(date) : undefined,
        source,
        paymentMethod,
        recurring,
        frequency,
        taxDeductible
      },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ msg: "Income record not found" });
    }

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete income
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
      type: "income"
    });

    if (!transaction) {
      return res.status(404).json({ msg: "Income record not found" });
    }

    res.json({ msg: "Income record deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
