const Class = require("../models/class.model");
const Booking = require("../models/booking.model");
const Wallet = require("../models/wallet.model");
const Auth = require("../models/auth.model");
const createGoogleMeetLink = require("../services/meet.service");
const { timeToMinutes } = require("../utils/seatHelper");
const { emitToUser, emitToAdmin } = require("../services/socket.service");

// Helper to convert date + time string to Date object
function getSlotDateTime(dateVal, timeStr) {
  const d = new Date(dateVal);
  const totalMins = timeToMinutes(timeStr);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  d.setHours(hours, mins, 0, 0);
  return d;
}

// Helper to calculate countdown string
function calculateCountdown(startDateTime, now) {
  const diffMs = startDateTime.getTime() - now.getTime();
  if (diffMs <= 0) return "Class starting now";
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const mins = totalMinutes % 60;

  if (days > 0) {
    return `Class in ${days} day${days > 1 ? "s" : ""}, ${hours} hour${hours > 1 ? "s" : ""}, ${mins} min${mins !== 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    return `Class in ${hours} hour${hours > 1 ? "s" : ""}, ${mins} min${mins !== 1 ? "s" : ""}`;
  }
  return `Class in ${mins} min${mins !== 1 ? "s" : ""}`;
}

// Helper to compute Meet Link and dynamic timing attributes per Class
async function computeClassStatusAndMeet(classRecord, userRole = "student") {
  if (classRecord.status === "completed") {
    return {
      countdown: "Completed",
      meetLink: null,
      canJoin: false,
      canComplete: false,
      timingState: "completed",
    };
  }

  const now = new Date();
  const startDateTime = getSlotDateTime(classRecord.date, classRecord.startTime);
  let endDateTime = getSlotDateTime(classRecord.date, classRecord.endTime);
  if (endDateTime <= startDateTime) {
    endDateTime = new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000);
  }

  // 1. BEFORE Class Time (Now < Start Time)
  if (now < startDateTime) {
    return {
      countdown: calculateCountdown(startDateTime, now),
      meetLink: null,
      canJoin: false,
      canComplete: false,
      timingState: "before",
    };
  }

  // 2. AT Class Time (Start Time <= Now <= End Time)
  if (now >= startDateTime && now <= endDateTime) {
    let meetLink = classRecord.meetLink;
    if (!meetLink) {
      const teacherUser = await Auth.findById(
        classRecord.teacher?._id || classRecord.teacher,
      );
      const startMin = timeToMinutes(classRecord.startTime);
      const endMin = timeToMinutes(classRecord.endTime);
      meetLink = await createGoogleMeetLink(
        `Class Session: ${classRecord.booking?.subject || "Subject"}`,
        startMin,
        endMin,
        teacherUser?.googleRefreshToken,
      );
      classRecord.meetLink = meetLink;
      await classRecord.save();

      emitToUser(classRecord.student?._id || classRecord.student, "classUpdated", {
        classRecord,
        action: "meet_link_created",
        meetLink,
      });
      emitToUser(classRecord.teacher?._id || classRecord.teacher, "classUpdated", {
        classRecord,
        action: "meet_link_created",
        meetLink,
      });
    }

    return {
      countdown: "Live Now",
      meetLink: classRecord.meetLink,
      canJoin: true,
      canComplete: false,
      timingState: "live",
    };
  }

  // 3. AFTER Class End Time (Now > End Time)
  return {
    countdown: "Class Ended",
    meetLink: null, // Hide Meet Link completely!
    canJoin: false,
    canComplete: userRole === "teacher",
    timingState: "after",
  };
}

// GET /api/classes/:id - Get single class session with dynamic Meet Link & timing
async function getClassById(req, res) {
  try {
    const userId = req.user._id.toString();
    const classId = req.params.id;

    const classRecord = await Class.findById(classId)
      .populate("teacher", "fullName email picture city country")
      .populate("student", "fullName email picture phone city country")
      .populate("booking", "subject grade status totalPrice");

    if (!classRecord) {
      return res.status(404).json({ message: "Class session not found" });
    }

    const isStudent =
      (classRecord.student?._id || classRecord.student).toString() === userId;
    const isTeacher =
      (classRecord.teacher?._id || classRecord.teacher).toString() === userId;
    const isAdmin = req.user.role?.includes("admin");

    if (!isStudent && !isTeacher && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized to view this class" });
    }

    const userRole = isTeacher ? "teacher" : "student";
    const timingInfo = await computeClassStatusAndMeet(classRecord, userRole);

    return res.status(200).json({
      classRecord,
      ...timingInfo,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch class session",
      error: error.message,
    });
  }
}

// PUT /api/classes/:id/complete - Teacher marks class as completed
async function completeClass(req, res) {
  try {
    const teacherId = req.user._id.toString();
    const classId = req.params.id;

    const classRecord = await Class.findById(classId);
    if (!classRecord) {
      return res.status(404).json({ message: "Class session not found" });
    }

    if (
      classRecord.teacher.toString() !== teacherId &&
      !req.user.role.includes("admin")
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this class" });
    }

    if (classRecord.status === "completed") {
      return res
        .status(400)
        .json({ message: "Class is already marked as completed" });
    }

    // Rule: Teacher can Mark Complete ONLY after Class End Time
    const now = new Date();
    const startDateTime = getSlotDateTime(classRecord.date, classRecord.startTime);
    let endDateTime = getSlotDateTime(classRecord.date, classRecord.endTime);
    if (endDateTime <= startDateTime) {
      endDateTime = new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000);
    }

    if (now <= endDateTime) {
      return res.status(400).json({
        message: "Class can only be marked complete after class end time",
      });
    }

    classRecord.status = "completed";
    classRecord.completedAt = new Date();
    await classRecord.save();

    // Check if ALL classes in this booking are completed
    const remainingIncomplete = await Class.countDocuments({
      booking: classRecord.booking,
      status: { $ne: "completed" },
    });

    let bookingCompleted = false;

    if (remainingIncomplete === 0) {
      const booking = await Booking.findById(classRecord.booking);
      if (booking && booking.status !== "completed") {
        booking.status = "completed";
        await booking.save();
        bookingCompleted = true;

        // Unlock teacher earnings from 'pending' to 'available'
        await Wallet.updateMany(
          {
            booking: booking._id,
            user: booking.teacher,
            type: "earning",
            status: "pending",
          },
          { status: "available" },
        );

        emitToUser(booking.student, "bookingUpdated", {
          booking,
          action: "completed",
          message: "All classes completed!",
        });
        emitToUser(booking.teacher, "bookingUpdated", {
          booking,
          action: "completed",
          message: "All classes completed! Earnings are now available in your wallet.",
        });
        emitToUser(booking.teacher, "walletUpdated", {
          action: "earning_available",
          message: "Earnings unlocked and added to available balance!",
        });
      }
    }

    emitToUser(classRecord.student, "classUpdated", {
      classRecord,
      action: "completed",
      message: "Class session marked as completed",
    });
    emitToUser(classRecord.teacher, "classUpdated", {
      classRecord,
      action: "completed",
      message: "Class session marked as completed",
    });
    emitToAdmin("classUpdated", {
      classRecord,
      action: "completed",
    });

    emitToUser(classRecord.student, "dashboardUpdated", { role: "student" });
    emitToUser(classRecord.teacher, "dashboardUpdated", { role: "teacher" });

    return res.status(200).json({
      message: bookingCompleted
        ? "Class completed! All classes finished, booking is now completed."
        : "Class marked as completed successfully.",
      classRecord,
      bookingCompleted,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to complete class", error: error.message });
  }
}

module.exports = {
  getClassById,
  completeClass,
  computeClassStatusAndMeet,
};
