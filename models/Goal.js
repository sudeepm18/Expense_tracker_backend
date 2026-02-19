const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    targetAmount: {
      type: Number,
      required: true,
      min: 0
    },

    currentAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    category: {
      type: String,
      default: "Savings"
    },

    deadline: {
      type: Date,
      required: true
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    progress: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active"
    }
  },
  { timestamps: true }
);

// Auto calculate progress
goalSchema.pre("save", function () {
  const target = Number(this.targetAmount) || 0;
  const current = Number(this.currentAmount) || 0;

  if (target > 0) {
    this.progress = (current / target) * 100;
  } else {
    this.progress = 0;
  }

  this.status = this.progress >= 100 ? "completed" : "active";
});



module.exports = mongoose.model("Goal", goalSchema);
