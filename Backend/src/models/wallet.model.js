const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    role: {
      type: String,
      enum: ["teacher", "student", "admin"],
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    type: {
      type: String,
      enum: [
        "earning",
        "commission",
        "withdraw",
        "refund",
        "booking_payment",
        "topup",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "pending_admin",
        "available",
        "completed",
        "approved",
        "rejected",
      ],
      default: "pending",
    },
    description: {
      type: String,
    },
  },
  { timestamps: true },
);

// Performance Indexes for wallet transactions & ledger
walletSchema.index({ user: 1, status: 1 });
walletSchema.index({ user: 1, type: 1, status: 1 });
walletSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Wallet", walletSchema);
