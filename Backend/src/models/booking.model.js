const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    timeSlot: {
      day: String,
      startTime: String,
      endTime: String,
    },
    daysPerWeek: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
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
    status: {
      type: String,
      enum: [
        "pending",
        "accepted_by_teacher",
        "payment_done, waiting_for_admin",
        "active",
        "completed",
        "cancelled",
        "payment_rejected",
        "expired",
        "confirmed",
      ],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["wallet", "manual", null],
      default: null,
    },
    paymentProof: {
      type: String,
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
    },
    acceptedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    adminApprovedAt: {
      type: Date,
    },
    adminRejectedAt: {
      type: Date,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    cancelledBy: {
      type: String,
      enum: ["student", "teacher", "admin", null],
      default: null,
    },
    cancellationReason: {
      type: String,
    },
    isRebooked: {
      type: Boolean,
      default: false,
    },
    rebookedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Performance Indexes for fast lookup, filtering, and expiry checks
bookingSchema.index({ student: 1, status: 1, updatedAt: -1 });
bookingSchema.index({ teacher: 1, status: 1, updatedAt: -1 });
bookingSchema.index({ status: 1, expiresAt: 1 });
bookingSchema.index({ student: 1, teacher: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Booking", bookingSchema);
