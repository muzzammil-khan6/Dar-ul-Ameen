const Booking = require("../models/booking.model");
const Class = require("../models/class.model");
const Schedule = require("../models/schedule.model");
const Chat = require("../models/chat.model");
const Auth = require("../models/auth.model");
const Wallet = require("../models/wallet.model");
const Trial = require("../models/trial.model");
const { emitToUser, emitToAdmin } = require("../services/socket.service");
const { checkTimeOverlap } = require("../utils/seatHelper");
const {
  calculateRateForSubject,
  getCommissionSettings,
  calculateCommission,
} = require("../services/pricing.service");

// Helper to get day name
const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Helper to expire any bookings accepted by teacher over 24 hours ago without student payment
async function expireOverdueBookings() {
  try {
    const overdue = await Booking.find({
      status: "accepted_by_teacher",
      expiresAt: { $lt: new Date() },
    });

    for (const b of overdue) {
      b.status = "expired";
      await b.save();

      emitToUser(b.student, "bookingUpdated", {
        booking: b,
        action: "expired",
        message: "Booking expired after 24 hours without payment.",
      });
      emitToUser(b.teacher, "bookingUpdated", {
        booking: b,
        action: "expired",
        message: "Booking expired after 24 hours without student payment.",
      });
      emitToAdmin("bookingUpdated", {
        booking: b,
        action: "expired",
      });
    }
  } catch (err) {
    console.error("Error auto-expiring overdue bookings:", err.message);
  }
}

// Helper to generate class sessions for monthly package (multiplying weekly schedule by 4 weeks)
function generateClasses(booking, teacherSchedule, startDate) {
  const classes = [];
  const start = new Date(startDate || Date.now());

  // Generate 4 full weeks of classes matching the teacher's selected days (4 recurring weekly cycles)
  for (let week = 0; week < 4; week++) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const classDate = new Date(start);
      classDate.setDate(start.getDate() + (week * 7) + dayOffset);
      const dayName = dayNames[classDate.getDay()];

      if (teacherSchedule.selectedDays.includes(dayName)) {
        // Find matching slot for that day and selected timing
        let slot =
          teacherSchedule.timeSlots.find(
            (s) =>
              s.day === dayName &&
              s.startTime === booking.timeSlot?.startTime &&
              s.endTime === booking.timeSlot?.endTime,
          ) ||
          teacherSchedule.timeSlots.find((s) => s.day === dayName) ||
          booking.timeSlot;

        classes.push({
          booking: booking._id,
          teacher: booking.teacher,
          student: booking.student,
          date: classDate,
          day: dayName,
          startTime: booking.timeSlot?.startTime || slot?.startTime || "16:00",
          endTime: booking.timeSlot?.endTime || slot?.endTime || "17:00",
          status: "scheduled",
        });
      }
    }
  }

  // Sort classes chronologically
  classes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return classes;
}

// POST /api/bookings - Create new booking (Student)
async function createBooking(req, res) {
  try {
    const studentId = req.user._id;
    let { teacherId, subject, grade, startDate, timeSlot } = req.body;

    await expireOverdueBookings();

    // Start date defaults to today's date
    if (!startDate) {
      const today = new Date();
      startDate = today.toISOString().split("T")[0];
    }

    if (!teacherId || !subject || !grade || !timeSlot) {
      return res.status(400).json({
        message:
          "All booking details (teacher, subject, grade, timeSlot) are required",
      });
    }

    const teacher = await Auth.findOne({
      _id: teacherId,
      role: "teacher",
      teachingStatus: "approved",
      isBlocked: { $ne: true },
    });
    if (!teacher) {
      return res
        .status(404)
        .json({ message: "Teacher not found or not approved" });
    }

    // Check if an active request already exists for this time slot with this teacher
    const activeBookingInSameSlot = await Booking.findOne({
      teacher: teacherId,
      status: {
        $in: [
          "pending",
          "accepted_by_teacher",
          "payment_done, waiting_for_admin",
          "active",
          "confirmed",
        ],
      },
      "timeSlot.startTime": timeSlot.startTime,
      "timeSlot.endTime": timeSlot.endTime,
    });

    if (activeBookingInSameSlot) {
      const isSameStudent =
        activeBookingInSameSlot.student.toString() === studentId.toString();
      return res.status(409).json({
        message: isSameStudent
          ? "You already have an active request for this time slot. Please choose another time slot or cancel the previous request."
          : "This time slot is already booked for this teacher. Please choose another time slot.",
        existingBookingId: activeBookingInSameSlot._id,
        status: activeBookingInSameSlot.status,
      });
    }

    const schedule = await Schedule.findOne({ teacher: teacherId });
    if (!schedule) {
      return res
        .status(400)
        .json({ message: "Teacher schedule is not available" });
    }

    // Availability Check for Paid Booking across teacher's selectedDays
    const activeTeacherTrials = await Trial.find({
      teacher: teacherId,
      status: { $in: ["pending", "accepted"] },
    });
    for (const t of activeTeacherTrials) {
      if (
        schedule.selectedDays.includes(t.day) &&
        checkTimeOverlap(
          timeSlot.startTime,
          timeSlot.endTime,
          t.startTime,
          t.endTime,
        )
      ) {
        // Rule: As long as an application remains active, there should be NO request other than
        // the paid request for this trial for the same time slot.
        const isStudentOwnTrial =
          t.student.toString() === studentId.toString() &&
          t.subject?.toLowerCase() === subject.toLowerCase();

        if (!isStudentOwnTrial) {
          return res.status(409).json({
            message:
              "Is time par pehle se Trial / Booking hai, doosra time ya din dekho",
          });
        }
      }
    }

    const activeTeacherPaid = await Booking.find({
      teacher: teacherId,
      status: {
        $in: [
          "pending",
          "accepted_by_teacher",
          "payment_done, waiting_for_admin",
          "active",
          "confirmed",
        ],
      },
    });
    for (const b of activeTeacherPaid) {
      if (
        b.timeSlot &&
        checkTimeOverlap(
          timeSlot.startTime,
          timeSlot.endTime,
          b.timeSlot.startTime,
          b.timeSlot.endTime,
        )
      ) {
        return res.status(409).json({
          message:
            "Is time par pehle se Trial / Booking hai, doosra time ya din dekho",
        });
      }
    }

    // Student conflict check across active trials and bookings
    const studentTrials = await Trial.find({
      student: studentId,
      status: { $in: ["pending", "accepted"] },
    });
    for (const t of studentTrials) {
      if (
        schedule.selectedDays.includes(t.day) &&
        checkTimeOverlap(
          timeSlot.startTime,
          timeSlot.endTime,
          t.startTime,
          t.endTime,
        )
      ) {
        // If this trial is the student's trial with this teacher being converted to this paid booking, allow it!
        const isConvertingOwnTrial =
          t.teacher.toString() === teacherId.toString() &&
          t.subject?.toLowerCase() === subject.toLowerCase();

        if (!isConvertingOwnTrial) {
          return res.status(409).json({
            message:
              "You already have another class scheduled at this time. Please choose another slot.",
          });
        }
      }
    }

    const studentBookings = await Booking.find({
      student: studentId,
      status: {
        $in: [
          "pending",
          "accepted_by_teacher",
          "payment_done, waiting_for_admin",
          "active",
          "confirmed",
        ],
      },
    });
    for (const b of studentBookings) {
      if (
        b.timeSlot &&
        checkTimeOverlap(
          timeSlot.startTime,
          timeSlot.endTime,
          b.timeSlot.startTime,
          b.timeSlot.endTime,
        )
      ) {
        return res.status(409).json({
          message:
            "You already have a paid package booked at this time. Please choose another slot.",
        });
      }
    }

    const daysPerWeek = schedule.daysPerWeek;
    const duration = schedule.duration;

    // Backend calculates the exact price from Admin Rate Formula
    const totalPrice = await calculateRateForSubject(
      subject,
      daysPerWeek,
      duration,
    );

    // Get Admin commission %
    const settings = await getCommissionSettings();
    const { commission, teacherShare } = calculateCommission(
      totalPrice,
      settings.commissionPercentage,
    );

    // Do NOT generate classes here! Classes are created ONLY upon Admin Payment Approval.
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 28); // 4-week monthly duration

    const booking = await Booking.create({
      student: studentId,
      teacher: teacherId,
      subject,
      grade,
      startDate: start,
      endDate: end,
      timeSlot,
      daysPerWeek,
      duration,
      totalPrice,
      commission,
      teacherShare,
      status: "pending",
      isPaid: false,
    });

    // Mark previous cancelled bookings for this student with this teacher in this same time slot as rebooked
    await Booking.updateMany(
      {
        student: studentId,
        teacher: teacherId,
        _id: { $ne: booking._id },
        "timeSlot.startTime": timeSlot.startTime,
        "timeSlot.endTime": timeSlot.endTime,
        status: { $in: ["cancelled", "canceled", "payment_rejected", "expired"] },
      },
      {
        $set: { isRebooked: true, rebookedAt: new Date() },
      },
    );

    const bookingObj = booking.toObject();
    delete bookingObj.commission;
    delete bookingObj.teacherShare;

    emitToUser(teacherId, "bookingUpdated", {
      booking: bookingObj,
      action: "created",
      message: "New booking request received!",
    });
    emitToAdmin("bookingUpdated", {
      booking: bookingObj,
      action: "created",
    });

    return res.status(201).json({
      message:
        "Booking request created successfully. Waiting for teacher acceptance.",
      booking: bookingObj,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create booking", error: error.message });
  }
}

// PUT /api/bookings/:id/accept - Teacher accepts booking
async function acceptBooking(req, res) {
  try {
    const teacherId = req.user._id;
    const bookingId = req.params.id;

    await expireOverdueBookings();

    const booking = await Booking.findOne({
      _id: bookingId,
      teacher: teacherId,
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        message: `Booking cannot be accepted from '${booking.status}' status`,
      });
    }

    // Step 1 - Teacher Accepts:
    // Booking Status = accepted_by_teacher. Do NOT create Classes. Do NOT show Meet Link. Do NOT show Countdown.
    // 24 hours expiry window
    booking.status = "accepted_by_teacher";
    booking.acceptedAt = new Date();
    booking.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await booking.save();

    emitToUser(booking.student, "bookingUpdated", {
      booking,
      action: "accepted",
      message: "Teacher accepted your booking! Please proceed to pay.",
    });
    emitToUser(booking.teacher, "bookingUpdated", {
      booking,
      action: "accepted",
      message: "You accepted the booking.",
    });
    emitToAdmin("bookingUpdated", {
      booking,
      action: "accepted",
    });

    return res.status(200).json({
      message:
        "Booking accepted. Waiting for student to pay within 24 hours.",
      booking,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to accept booking", error: error.message });
  }
}

// PUT /api/bookings/:id/reject - Teacher rejects booking
async function rejectBooking(req, res) {
  try {
    const teacherId = req.user._id;
    const bookingId = req.params.id;
    const { reason } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      teacher: teacherId,
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        message: `Booking cannot be rejected from '${booking.status}' status`,
      });
    }

    booking.status = "cancelled";
    booking.cancelledBy = "teacher";
    booking.cancellationReason = reason || "Rejected by teacher";
    await booking.save();

    await Class.updateMany(
      { booking: bookingId, status: "scheduled" },
      { status: "cancelled" },
    );

    emitToUser(booking.student, "bookingUpdated", {
      booking,
      action: "rejected",
      message: "Teacher rejected your booking request.",
    });
    emitToUser(booking.teacher, "bookingUpdated", {
      booking,
      action: "rejected",
      message: "Booking rejected.",
    });
    emitToAdmin("bookingUpdated", {
      booking,
      action: "rejected",
    });

    return res.status(200).json({
      message: "Booking rejected and cancelled",
      booking,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to reject booking", error: error.message });
  }
}

// PUT /api/bookings/:id/cancel - Student or Teacher cancels booking
async function cancelBooking(req, res) {
  try {
    const userId = req.user._id.toString();
    const bookingId = req.params.id;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const isStudent = booking.student.toString() === userId;
    const isTeacher = booking.teacher.toString() === userId;
    const isAdmin = req.user.role.includes("admin");

    if (!isStudent && !isTeacher && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized to cancel this booking" });
    }

    if (["completed", "cancelled", "payment_rejected", "expired"].includes(booking.status)) {
      return res
        .status(400)
        .json({ message: `Cannot cancel a ${booking.status} booking` });
    }

    // Cancellation before payment or while waiting for payment
    if (
      booking.status === "pending" ||
      booking.status === "accepted_by_teacher" ||
      booking.status === "confirmed"
    ) {
      booking.status = "cancelled";
      booking.cancelledBy = isStudent
        ? "student"
        : isTeacher
        ? "teacher"
        : "admin";
      booking.cancellationReason = reason || "Cancelled before payment";
      await booking.save();

      await Class.updateMany(
        { booking: bookingId, status: "scheduled" },
        { status: "cancelled" },
      );

      emitToUser(booking.student, "bookingUpdated", {
        booking,
        action: "cancelled",
        message: "Booking cancelled successfully",
      });
      emitToUser(booking.teacher, "bookingUpdated", {
        booking,
        action: "cancelled",
        message: "Booking was cancelled",
      });
      emitToAdmin("bookingUpdated", {
        booking,
        action: "cancelled",
      });

      return res.status(200).json({
        message: "Booking cancelled successfully",
        booking,
      });
    }

    // Cancellation while payment is pending admin approval
    if (booking.status === "payment_done, waiting_for_admin") {
      booking.status = "cancelled";
      booking.cancelledBy = isStudent
        ? "student"
        : isTeacher
        ? "teacher"
        : "admin";
      booking.cancellationReason = reason || "Cancelled by user";
      await booking.save();

      // If paid via wallet, automatically refund back to student wallet
      if (booking.paymentMethod === "wallet") {
        const updatedStudent = await Auth.findByIdAndUpdate(
          booking.student,
          { $inc: { studentWallet: booking.totalPrice } },
          { new: true },
        );

        await Wallet.create({
          user: booking.student,
          role: "student",
          booking: booking._id,
          type: "refund",
          amount: booking.totalPrice,
          status: "completed",
          description: `Refund for cancelled booking #${booking._id}`,
        });

        emitToUser(booking.student, "walletUpdated", {
          balance: updatedStudent?.studentWallet || 0,
          action: "refund",
          amount: booking.totalPrice,
        });
      }

      emitToUser(booking.student, "bookingUpdated", {
        booking,
        action: "cancelled",
        message: "Booking cancelled. Any wallet deductions refunded.",
      });
      emitToUser(booking.teacher, "bookingUpdated", {
        booking,
        action: "cancelled",
        message: "Booking cancelled.",
      });
      emitToAdmin("bookingUpdated", {
        booking,
        action: "cancelled",
      });

      return res.status(200).json({
        message:
          "Booking cancelled. Any wallet deductions have been refunded.",
        booking,
      });
    }

    // Cancellation when active (already approved and paid)
    if (booking.status === "active") {
      booking.status = "cancelled";
      booking.cancelledBy = isStudent
        ? "student"
        : isTeacher
        ? "teacher"
        : "admin";
      booking.cancellationReason = reason || "Cancelled after payment";
      await booking.save();

      // Refund to Student Wallet
      const updatedStudent = await Auth.findByIdAndUpdate(
        booking.student,
        { $inc: { studentWallet: booking.totalPrice } },
        { new: true },
      );

      await Wallet.create({
        user: booking.student,
        role: "student",
        booking: booking._id,
        type: "refund",
        amount: booking.totalPrice,
        status: "completed",
        description: `Refund for cancelled booking #${booking._id}`,
      });

      // Void pending teacher earnings
      await Wallet.updateMany(
        { booking: booking._id, user: booking.teacher, type: "earning" },
        { status: "rejected" },
      );

      await Class.updateMany(
        { booking: bookingId, status: "scheduled" },
        { status: "cancelled" },
      );

      emitToUser(booking.student, "walletUpdated", {
        balance: updatedStudent?.studentWallet || 0,
        action: "refund",
        amount: booking.totalPrice,
      });
      emitToUser(booking.student, "bookingUpdated", {
        booking,
        action: "cancelled",
        message: "Booking cancelled. Refund credited to your wallet.",
      });
      emitToUser(booking.teacher, "bookingUpdated", {
        booking,
        action: "cancelled",
        message: "Booking was cancelled.",
      });
      emitToAdmin("bookingUpdated", {
        booking,
        action: "cancelled",
      });

      return res.status(200).json({
        message:
          "Booking cancelled. Full refund has been credited to Student Wallet.",
        booking,
      });
    }

    return res.status(400).json({ message: "Unable to cancel booking" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to cancel booking", error: error.message });
  }
}

// POST /api/bookings/:id/chat - Send chat message
async function sendChat(req, res) {
  try {
    const userId = req.user._id.toString();
    const bookingId = req.params.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const isStudent = booking.student.toString() === userId;
    const isTeacher = booking.teacher.toString() === userId;
    const isAdmin = req.user.role.includes("admin");

    if (!isStudent && !isTeacher && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied: Not a participant of this booking" });
    }

    if (
      ["pending", "cancelled", "payment_rejected", "expired"].includes(
        booking.status,
      )
    ) {
      return res.status(400).json({
        message:
          "Chat is only available for active, confirmed, and completed bookings",
      });
    }

    const chatMsg = await Chat.create({
      booking: bookingId,
      sender: req.user._id,
      senderRole: req.session
        ? req.session.activeRole
        : isTeacher
        ? "teacher"
        : "student",
      senderName: req.user.fullName,
      message: message.trim(),
    });

    const populatedMsg = await Chat.findById(chatMsg._id).populate(
      "sender",
      "fullName picture",
    );

    return res.status(201).json({
      message: "Message sent",
      chat: populatedMsg,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to send message", error: error.message });
  }
}

module.exports = {
  createBooking,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  sendChat,
  generateClasses,
  expireOverdueBookings,
};
