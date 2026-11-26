const Booking = require("../models/booking.model");
const Payment = require("../models/payment.model");
const Wallet = require("../models/wallet.model");
const Auth = require("../models/auth.model");
const { emitToUser, emitToAdmin } = require("../services/socket.service");

// POST /api/payments/pay - Pay for booking (Student)
async function payForBooking(req, res) {
  try {
    const studentId = req.user._id.toString();
    const {
      bookingId,
      paymentMethod = "wallet",
      transactionId,
      paymentProof,
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (
      booking.student.toString() !== studentId &&
      !req.user.role?.includes("admin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to pay for this booking" });
    }

    // Check double payment or inappropriate status
    if (booking.isPaid || booking.status === "active" || booking.status === "completed") {
      return res.status(400).json({ message: "This booking is already paid" });
    }

    if (
      booking.status !== "accepted_by_teacher" &&
      booking.status !== "confirmed"
    ) {
      return res.status(400).json({
        message: `Payment can only be made after teacher accepts the booking. Current status: ${booking.status}`,
      });
    }

    // Check 24-hour expiration
    if (booking.expiresAt && new Date() > new Date(booking.expiresAt)) {
      booking.status = "expired";
      await booking.save();
      return res.status(400).json({
        message: "This booking request has expired (24-hour limit exceeded).",
      });
    }

    const studentUser = await Auth.findById(booking.student);
    if (!studentUser) {
      return res.status(404).json({ message: "Student account not found" });
    }

    // Option A: Pay from Wallet (Main Method)
    if (paymentMethod === "wallet") {
      const studentBalance = studentUser.studentWallet || 0;
      if (studentBalance < booking.totalPrice) {
        return res.status(400).json({
          message: "Insufficient wallet balance. Please add money to your wallet.",
          insufficientBalance: true,
          currentBalance: studentBalance,
          requiredAmount: booking.totalPrice,
        });
      }

      // Deduct from Wallet
      studentUser.studentWallet -= booking.totalPrice;
      await studentUser.save();

      // Create Transaction type=booking_payment, status=pending_admin
      await Wallet.create({
        user: studentUser._id,
        role: "student",
        booking: booking._id,
        type: "booking_payment",
        amount: booking.totalPrice,
        status: "pending_admin",
        description: `Payment for booking #${booking._id} (${booking.subject}) via Student Wallet`,
      });

      // Update Booking Status = payment_done, waiting_for_admin
      booking.status = "payment_done, waiting_for_admin";
      booking.paymentMethod = "wallet";
      booking.isPaid = false; // Confirmed upon Admin approval
      await booking.save();

      emitToUser(studentUser._id, "walletUpdated", {
        balance: studentUser.studentWallet,
        action: "deduct",
        amount: booking.totalPrice,
      });

      emitToUser(booking.student, "bookingUpdated", {
        booking,
        action: "payment_done, waiting_for_admin",
        message: "Payment successful. Waiting for Admin approval.",
      });
      emitToUser(booking.teacher, "bookingUpdated", {
        booking,
        action: "payment_done, waiting_for_admin",
        message: "Student paid from wallet. Waiting for Admin approval.",
      });
      emitToAdmin("bookingUpdated", {
        booking,
        action: "payment_done, waiting_for_admin",
        message: "New payment received from student wallet.",
      });

      return res.status(200).json({
        message: "Payment successful from wallet. Waiting for Admin Approval.",
        booking,
        walletBalance: studentUser.studentWallet,
      });
    }

    // Option B: Pay via JazzCash / Easypaisa / Manual Proof Directly
    if (paymentMethod === "manual" || paymentMethod === "jazzcash" || paymentMethod === "easypaisa") {
      if (!transactionId || !transactionId.trim()) {
        return res.status(400).json({
          message: "Transaction ID is required for direct payment submission.",
        });
      }
      if (!paymentProof) {
        return res.status(400).json({
          message: "Screenshot proof of transaction is required.",
        });
      }

      booking.status = "payment_done, waiting_for_admin";
      booking.paymentMethod = "manual";
      booking.transactionId = transactionId.trim();
      booking.paymentProof = paymentProof;
      booking.isPaid = false;
      await booking.save();

      emitToUser(booking.student, "bookingUpdated", {
        booking,
        action: "payment_done, waiting_for_admin",
        message: "Payment proof submitted. Waiting for Admin approval.",
      });
      emitToUser(booking.teacher, "bookingUpdated", {
        booking,
        action: "payment_done, waiting_for_admin",
        message: "Student submitted payment proof. Waiting for Admin approval.",
      });
      emitToAdmin("bookingUpdated", {
        booking,
        action: "payment_done, waiting_for_admin",
        message: "New manual payment proof received.",
      });

      return res.status(200).json({
        message:
          "Payment proof submitted successfully. Waiting for Admin Approval.",
        booking,
      });
    }

    return res.status(400).json({
      message: "Invalid payment method specified. Use 'wallet' or 'manual'.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Payment processing failed", error: error.message });
  }
}

module.exports = {
  payForBooking,
};
