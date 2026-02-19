const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Goal = require("../models/Goal");
const mongoose = require("mongoose");

const router = express.Router();

// Get all goals for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const goals = await Goal.find({
      userId: new mongoose.Types.ObjectId(req.user.id),
    }).sort({ createdAt: -1 });

    res.json(goals);
  } catch (err) {
    console.error("Fetch goals error:", err);
    res.status(500).json({ error: err.message });
  }
});


// Get single goal
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.user.id)
    });

    if (!goal) return res.status(404).json({ msg: "Goal not found" });

    res.json(goal);
  } catch (err) {
    console.error("❌ Error fetching goal:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Create new goal
router.post("/", authMiddleware, async (req, res) => {
  try {
    console.log("📥 Creating goal...");
    console.log("User ID:", req.user.id);
    console.log("Body:", req.body);

    const { title, targetAmount, currentAmount, category, deadline, priority } =
      req.body;
    if (!req.user?.id) {
  return res.status(401).json({ msg: "Unauthorized" });
}

    if (!title || !targetAmount || !deadline) {
      return res
        .status(400)
        .json({ msg: "Title, targetAmount, and deadline are required" });
    }

    console.log("✅ Validation passed, creating goal...");

    const goal = await Goal.create({
      userId: new mongoose.Types.ObjectId(req.user.id),
      title: title.trim(),
      targetAmount: Number(targetAmount),
      currentAmount: currentAmount ? Number(currentAmount) : 0,
      category: category || "Savings",
      deadline: new Date(deadline),
      priority: priority || "medium"
    });

    console.log("✅ Goal created:", goal._id);
    res.status(201).json(goal);
  } catch (err) {
    console.error("❌ Error creating goal:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ error: err.message });
  }
});

// Update goal
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.user.id)
    });

    if (!goal) return res.status(404).json({ msg: "Goal not found" });

    const { title, targetAmount, currentAmount, category, deadline, priority } =
      req.body;

    if (title) goal.title = title;
    if (targetAmount) goal.targetAmount = Number(targetAmount);
    if (currentAmount !== undefined) goal.currentAmount = Number(currentAmount);
    if (category) goal.category = category;
    if (deadline) goal.deadline = new Date(deadline);
    if (priority) goal.priority = priority;

    await goal.save();
    res.json(goal);
  } catch (err) {
    console.error("❌ Error updating goal:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete goal
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.user.id)
    });

    if (!goal) return res.status(404).json({ msg: "Goal not found" });

    res.json({ msg: "Goal deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting goal:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
