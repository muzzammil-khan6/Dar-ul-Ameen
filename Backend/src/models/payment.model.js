const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    commission: {
      type: Number,
      required: true,
    },
    teacherShare: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: "Wallet / Mock Payment",
    },
    status: {
      type: String,
      enum: ["paid", "refunded"],
      default: "paid",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
