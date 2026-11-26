const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
      unique: true,
    },
    subjects: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
        },
        name: {
          type: String,
          required: true,
        },
        grades: [
          {
            type: String,
            required: true,
          },
        ],
      },
    ],
    daysPerWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },
    selectedDays: [
      {
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
    ],
    duration: {
      type: Number,
      enum: [20, 30, 40, 50, 60],
      required: true,
    },
    timeSlots: [
      {
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
        startTime: {
          type: String,
          required: true,
        },
        endTime: {
          type: String,
          required: true,
        },
      },
    ],
    rates: [
      {
        subjectName: String,
        calculatedRate: Number,
      },
    ],
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Schedule", scheduleSchema);
