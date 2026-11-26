const mongoose = require("mongoose");

const trialSchema = new mongoose.Schema(
  {
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
    subject: {
      type: String,
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    date: {
      type: Date,
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
    duration: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
      default: "pending",
    },
    cancelledBy: {
      type: String,
      enum: ["student", "teacher", null],
      default: null,
    },
    cancellationReason: {
      type: String,
    },
    rejectionReason: {
      type: String,
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

// Performance Indexes for trial searches and teacher/student scheduling
trialSchema.index({ student: 1, status: 1, date: 1 });
trialSchema.index({ teacher: 1, status: 1, date: 1 });
trialSchema.index({ student: 1, teacher: 1 });
trialSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Trial", trialSchema);
