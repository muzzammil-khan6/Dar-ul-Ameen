const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    day: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "missed", "cancelled"],
      default: "scheduled",
    },
    completedAt: {
      type: Date,
    },
    meetLink: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Performance Indexes for fast class sessions lookup
classSchema.index({ booking: 1 });
classSchema.index({ student: 1, status: 1, date: 1 });
classSchema.index({ teacher: 1, status: 1, date: 1 });
classSchema.index({ date: 1, startTime: 1 });

module.exports = mongoose.model("Class", classSchema);
