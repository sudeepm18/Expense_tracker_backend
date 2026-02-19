const express = require("express");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get yall expenses for a user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.id,
      type: "expense"
    }).sort({ date: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get remaining budget (remaining credits)
router.get("/budget/remaining", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Get current month's expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyExpenses = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          type: "expense",
          date: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    const totalSpent = monthlyExpenses.length > 0 ? monthlyExpenses[0].total : 0;
    const monthlyBudget = user.monthlyBudget !== undefined ? user.monthlyBudget : 0;
    const remainingBudget = monthlyBudget - totalSpent;

    res.json({
      monthlyBudget,
      totalSpent,
      remainingBudget,
      spentPercentage: (totalSpent / monthlyBudget) * 100
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single expense
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({ msg: "Expense not found" });
    }

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new expense
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, amount, category, description, date, paymentMethod, recurring } = req.body;

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
      type: "expense",
      category,
      description: description || "",
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || "cash",
      recurring: recurring || false
    });

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update expense
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, amount, category, description, date, paymentMethod, recurring } = req.body;

    if (amount && amount <= 0) {
      return res.status(400).json({ msg: "Amount must be greater than 0" });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        title,
        amount: amount ? parseFloat(amount) : undefined,
        category,
        description,
        date: date ? new Date(date) : undefined,
        paymentMethod,
        recurring
      },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ msg: "Expense not found" });
    }

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete expense
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({ msg: "Expense not found" });
    }

    res.json({ msg: "Expense deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
