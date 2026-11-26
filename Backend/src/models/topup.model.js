const mongoose = require("mongoose");

const topupSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Topup amount is required"],
      min: [1, "Minimum topup amount is 1"],
    },
    paymentMethod: {
      type: String,
      enum: ["JazzCash", "Easypaisa", "Bank Transfer", "manual"],
      default: "JazzCash",
    },
    transactionId: {
      type: String,
      required: [true, "Transaction ID is required"],
      trim: true,
    },
    screenshot: {
      type: String,
      required: [true, "Payment proof screenshot is required"],
    },
    status: {
      type: String,
      enum: ["pending_admin", "approved", "rejected"],
      default: "pending_admin",
    },
    adminNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// Performance Indexes for topups
topupSchema.index({ student: 1, status: 1 });
topupSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Topup", topupSchema);
