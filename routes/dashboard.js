const express = require("express");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Goal = require("../models/Goal");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get complete financial summary with remaining credits
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ msg: "Invalid User ID" });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Get current month's date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get monthly expenses
    const monthlyExpensesData = await Transaction.aggregate([
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

    // Get monthly income
    const monthlyIncomeData = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          type: "income",
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

    // Get category breakdown for expenses
    const categoryBreakdown = await Transaction.aggregate([
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
          _id: "$category",
          amount: { $sum: "$amount" }
        }
      },
      {
        $sort: { amount: -1 }
      }
    ]);

    // Calculate totals
    const totalExpenses = monthlyExpensesData.length > 0 ? monthlyExpensesData[0].total : 0;
    const totalIncome = monthlyIncomeData.length > 0 ? monthlyIncomeData[0].total : 0;
    const monthlyBudget = user.monthlyBudget !== undefined ? Number(user.monthlyBudget) : 0;
    
    // Remaining credits = Monthly Budget + Monthly Income - Monthly Expenses
    const remainingCredits = (monthlyBudget + totalIncome) - totalExpenses;
    const netIncome = totalIncome - totalExpenses;
    const totalAvailable = monthlyBudget + totalIncome;
    const expensePercentage = totalAvailable > 0 ? (totalExpenses / totalAvailable) * 100 : 0;
    const incomePercentage = totalAvailable > 0 ? (totalIncome / totalAvailable) * 100 : 0;

    // Get recent transactions (last 10)
    const recentTransactions = await Transaction.find({
      userId: req.user.id
    })
      .sort({ date: -1 })
      .limit(10);

    // Get active goals for the user
    const activeGoals = await Goal.find({
      userId: req.user.id,
      status: "active"
    }).sort({ createdAt: -1 });

    res.json({
      monthlyBudget,
      totalExpenses,
      totalIncome,
      remainingCredits,
      netIncome,
      expensePercentage,
      incomePercentage,
      categoryBreakdown,
      recentTransactions,
      activeGoals,
      month: startOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all transactions (both income and expense)
router.get("/transactions", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.id
    }).sort({ date: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
