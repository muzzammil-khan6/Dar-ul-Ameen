const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    commissionPercentage: {
      type: Number,
      required: true,
      default: 20,
      min: 0,
      max: 100,
    },
    platformName: {
      type: String,
      default: "Dar-ul-Ameen Tutor Booking Platform",
    },
    minWithdrawal: {
      type: Number,
      default: 500,
    },
    jazzcashNumber: {
      type: String,
      default: "03001234567",
    },
    jazzcashTitle: {
      type: String,
      default: "Dar-ul-Ameen Official",
    },
    easypaisaNumber: {
      type: String,
      default: "03451234567",
    },
    easypaisaTitle: {
      type: String,
      default: "Dar-ul-Ameen Official",
    },
    bankName: {
      type: String,
      default: "Meezan Bank",
    },
    bankAccountNumber: {
      type: String,
      default: "01020304050607",
    },
    bankAccountTitle: {
      type: String,
      default: "Dar-ul-Ameen",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Settings", settingsSchema);
