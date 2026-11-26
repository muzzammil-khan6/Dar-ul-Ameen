const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      unique: true,
      trim: true,
    },
    grades: [
      {
        type: String,
        trim: true,
      },
    ],
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

module.exports = mongoose.model("Subject", subjectSchema);
