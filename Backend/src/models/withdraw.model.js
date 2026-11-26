const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Withdrawal amount is required"],
      min: [500, "Minimum withdrawal is 500"],
    },
    accountDetails: {
      type: String,
      required: [true, "Bank or payment details are required"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

withdrawSchema.index({ teacher: 1, status: 1 });

module.exports = mongoose.model("Withdraw", withdrawSchema);
