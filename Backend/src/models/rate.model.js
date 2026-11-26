const mongoose = require("mongoose");

const rateSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    subjectName: {
      type: String,
      required: [true, "Subject name is required"],
      unique: true,
      trim: true,
    },
    // Rate for 7 Days Per Week / 1 Hour Class
    weeklyFullRate: {
      type: Number,
      required: [true, "Weekly full rate is required"],
      min: [1, "Rate must be greater than 0"],
    },
    monthlyFullRate: {
      type: Number,
      min: [1, "Rate must be greater than 0"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Rate", rateSchema);
