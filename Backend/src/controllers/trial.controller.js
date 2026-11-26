const Trial = require("../models/trial.model");
const Booking = require("../models/booking.model");
const Auth = require("../models/auth.model");
const Schedule = require("../models/schedule.model");
const createGoogleMeetLink = require("../services/meet.service");
const { emitToUser, emitToAdmin } = require("../services/socket.service");
const {
  getNextDayOccurrence,
  checkTimeOverlap,
  splitSlotIntoSeats,
  timeToMinutes,
} = require("../utils/seatHelper");

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

// Fast Helper to compute dynamic timing attributes per Trial without blocking external API calls
function computeTrialStatusAndMeet(trial, userRole = "student") {
  if (trial.status !== "accepted") {
    return {
      countdown: null,
      meetLink: null,
      canJoin: false,
      canComplete: false,
      canCancel: trial.status === "pending",
      timingState: trial.status,
    };
  }

  const now = new Date();
  const startDateTime = getSlotDateTime(trial.date, trial.startTime);
  let endDateTime = getSlotDateTime(trial.date, trial.endTime);
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
      canCancel: userRole === "student",
      timingState: "before",
    };
  }

  // 2. AT Class Time (Start Time <= Now <= End Time)
  if (now >= startDateTime && now <= endDateTime) {
    return {
      countdown: "Live Now",
      meetLink: trial.meetLink,
      canJoin: Boolean(trial.meetLink),
      canComplete: false,
      canCancel: false,
      timingState: "live",
    };
  }

  // 3. AFTER Class End Time (Now > End Time)
  return {
    countdown: "Class Ended",
    meetLink: null, // Hide Meet Link completely
    canJoin: false,
    canComplete: userRole === "teacher",
    canCancel: false,
    timingState: "after",
  };
}

// POST /api/trials - Student books a free trial
async function createTrial(req, res) {
  try {
    const studentId = req.user._id;
    let { teacherId, subject, grade, day, seat, startTime, endTime } = req.body;

    if (!seat && startTime && endTime) {
      seat = { startTime, endTime };
    }

    if (
      !teacherId ||
      !subject ||
      !grade ||
      !day ||
      !seat ||
      !seat.startTime ||
      !seat.endTime
    ) {
      return res.status(400).json({
        message:
          "Teacher, subject, grade, day, and seat (startTime & endTime) are required.",
      });
    }

    // Verify Teacher exists, is approved, not blocked
    const teacher = await Auth.findOne({
      _id: teacherId,
      role: "teacher",
      teachingStatus: "approved",
      isBlocked: { $ne: true },
    });
    if (!teacher) {
      return res
        .status(404)
        .json({ message: "Teacher not found or not approved." });
    }

    // Verify Teacher Schedule
    const schedule = await Schedule.findOne({ teacher: teacherId });
    if (!schedule) {
      return res
        .status(400)
        .json({ message: "Teacher has not configured their schedule yet." });
    }

    // Verify day is among teacher's selected days
    if (!schedule.selectedDays.includes(day)) {
      return res
        .status(400)
        .json({ message: `Teacher is not available on ${day}.` });
    }

    // Verify subject & grade
    const subDoc = schedule.subjects.find((s) => s.name === subject);
    if (!subDoc) {
      return res
        .status(400)
        .json({ message: `Teacher does not teach ${subject}.` });
    }
    if (
      subDoc.grades &&
      subDoc.grades.length > 0 &&
      !subDoc.grades.includes(grade)
    ) {
      return res
        .status(400)
        .json({ message: `Teacher does not teach ${subject} for ${grade}.` });
    }

    // RULE 2: Only 1 Trial per Student per Teacher for same subject.
    const existingTrial = await Trial.findOne({
      student: studentId,
      teacher: teacherId,
      subject,
      status: { $in: ["pending", "accepted", "completed"] },
    });
    if (existingTrial) {
      return res.status(400).json({
        message: "You already took a trial with this teacher",
        alreadyTaken: true,
        trialStatus: existingTrial.status,
      });
    }

    // RULE 7: Availability check - check conflicting Trials
    const conflictingTrials = await Trial.find({
      teacher: teacherId,
      day,
      status: { $in: ["pending", "accepted"] },
    });
    for (const t of conflictingTrials) {
      if (
        checkTimeOverlap(seat.startTime, seat.endTime, t.startTime, t.endTime)
      ) {
        return res.status(409).json({
          message:
            "Is time par pehle se Trial / Booking hai, doosra time ya din dekho",
        });
      }
    }

    // Check conflicting Paid Bookings
    const conflictingPaidBookings = await Booking.find({
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
    for (const b of conflictingPaidBookings) {
      if (
        b.timeSlot &&
        checkTimeOverlap(
          seat.startTime,
          seat.endTime,
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

    // Student conflict check across active trials
    const studentActiveTrials = await Trial.find({
      student: studentId,
      day,
      status: { $in: ["pending", "accepted"] },
    });
    for (const t of studentActiveTrials) {
      if (
        checkTimeOverlap(seat.startTime, seat.endTime, t.startTime, t.endTime)
      ) {
        return res.status(409).json({
          message:
            "You already have another trial scheduled at this time. Please choose another slot.",
        });
      }
    }

    const studentActiveBookings = await Booking.find({
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
    for (const b of studentActiveBookings) {
      if (
        b.timeSlot &&
        checkTimeOverlap(
          seat.startTime,
          seat.endTime,
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

    const duration = schedule.duration;
    const trialDate = getNextDayOccurrence(day);

    const trial = await Trial.create({
      student: studentId,
      teacher: teacherId,
      subject,
      grade,
      day,
      date: trialDate,
      startTime: seat.startTime,
      endTime: seat.endTime,
      duration,
      status: "pending",
    });

    emitToUser(teacherId, "trialUpdated", {
      trial,
      action: "created",
      message: "New free trial request received!",
    });
    emitToAdmin("trialUpdated", {
      trial,
      action: "created",
    });

    return res.status(201).json({
      message: "Free trial requested successfully.",
      trial,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create trial request",
      error: error.message,
    });
  }
}

// PUT /api/trials/:id/accept - Teacher accepts trial
async function acceptTrial(req, res) {
  try {
    const teacherId = req.user._id;
    const { id } = req.params;

    const trial = await Trial.findOne({ _id: id, teacher: teacherId });
    if (!trial) {
      return res.status(404).json({ message: "Trial not found" });
    }

    if (trial.status !== "pending") {
      return res.status(400).json({
        message: `Trial cannot be accepted from '${trial.status}' status`,
      });
    }

    // Trial Status = accepted. Do NOT show [Complete] / [Cancel] button yet. Do NOT create a permanent Class.
    trial.status = "accepted";
    await trial.save();

    emitToUser(trial.student, "trialUpdated", {
      trial,
      action: "accepted",
      message: "Teacher accepted your trial request!",
    });
    emitToUser(trial.teacher, "trialUpdated", {
      trial,
      action: "accepted",
      message: "You accepted the trial request.",
    });
    emitToAdmin("trialUpdated", {
      trial,
      action: "accepted",
    });

    return res.status(200).json({
      message: "Trial request accepted successfully",
      trial,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to accept trial",
      error: error.message,
    });
  }
}

// PUT /api/trials/:id/reject - Teacher rejects trial
async function rejectTrial(req, res) {
  try {
    const teacherId = req.user._id;
    const { id } = req.params;
    const { reason } = req.body;

    const trial = await Trial.findOne({ _id: id, teacher: teacherId });
    if (!trial) {
      return res.status(404).json({ message: "Trial not found" });
    }

    if (trial.status !== "pending") {
      return res.status(400).json({
        message: `Trial cannot be rejected from '${trial.status}' status`,
      });
    }

    trial.status = "rejected";
    trial.rejectionReason = reason || "Teacher unavailable at requested time";
    await trial.save();

    emitToUser(trial.student, "trialUpdated", {
      trial,
      action: "rejected",
      message: "Teacher declined your trial request.",
    });
    emitToUser(trial.teacher, "trialUpdated", {
      trial,
      action: "rejected",
      message: "Trial request rejected.",
    });
    emitToAdmin("trialUpdated", {
      trial,
      action: "rejected",
    });

    return res.status(200).json({
      message: "Trial request rejected",
      trial,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to reject trial",
      error: error.message,
    });
  }
}

// PUT /api/trials/:id/cancel - Student or Teacher cancels trial
async function cancelTrial(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { reason } = req.body;

    const trial = await Trial.findById(id);
    if (!trial) {
      return res.status(404).json({ message: "Trial not found" });
    }

    const isStudent = trial.student.toString() === userId.toString();
    const isTeacher = trial.teacher.toString() === userId.toString();

    if (!isStudent && !isTeacher) {
      return res
        .status(403)
        .json({ message: "Unauthorized to cancel this trial" });
    }

    if (["completed", "cancelled", "rejected"].includes(trial.status)) {
      return res.status(400).json({
        message: `Cannot cancel a ${trial.status} trial`,
      });
    }

    // Cancel Rule: Student can Cancel Trial ONLY before Start Time
    if (isStudent && trial.status === "accepted") {
      const now = new Date();
      const startDateTime = getSlotDateTime(trial.date, trial.startTime);
      if (now >= startDateTime) {
        return res.status(400).json({
          message: "Student can cancel trial only before start time",
        });
      }
    }

    trial.status = "cancelled";
    trial.cancelledBy = isStudent ? "student" : "teacher";
    trial.cancellationReason = reason || "Cancelled by user";
    await trial.save();

    emitToUser(trial.student, "trialUpdated", {
      trial,
      action: "cancelled",
      message: "Trial was cancelled.",
    });
    emitToUser(trial.teacher, "trialUpdated", {
      trial,
      action: "cancelled",
      message: "Trial was cancelled.",
    });
    emitToAdmin("trialUpdated", {
      trial,
      action: "cancelled",
    });

    return res.status(200).json({
      message: "Trial cancelled successfully",
      trial,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to cancel trial",
      error: error.message,
    });
  }
}

// PUT /api/trials/:id/complete - Teacher marks trial completed
async function completeTrial(req, res) {
  try {
    const teacherId = req.user._id;
    const { id } = req.params;

    const trial = await Trial.findOne({ _id: id, teacher: teacherId });
    if (!trial) {
      return res.status(404).json({ message: "Trial not found" });
    }

    if (trial.status !== "accepted") {
      return res.status(400).json({
        message: `Only accepted trials can be marked completed`,
      });
    }

    // Rule: Teacher can Mark Complete ONLY after Class End Time
    const now = new Date();
    const startDateTime = getSlotDateTime(trial.date, trial.startTime);
    let endDateTime = getSlotDateTime(trial.date, trial.endTime);
    if (endDateTime <= startDateTime) {
      endDateTime = new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000);
    }

    if (now <= endDateTime) {
      return res.status(400).json({
        message: "Teacher can mark complete only after class end time",
      });
    }

    trial.status = "completed";
    trial.completedAt = new Date();
    await trial.save();

    emitToUser(trial.student, "trialUpdated", {
      trial,
      action: "completed",
      message: "Trial class marked as completed.",
    });
    emitToUser(trial.teacher, "trialUpdated", {
      trial,
      action: "completed",
      message: "Trial class marked as completed.",
    });
    emitToAdmin("trialUpdated", {
      trial,
      action: "completed",
    });

    return res.status(200).json({
      message: "Trial class marked as completed",
      trial,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to complete trial",
      error: error.message,
    });
  }
}

// GET /api/trials/:id - Fetch single trial with live countdown & Meet info
async function getTrialById(req, res) {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;

    const trial = await Trial.findById(id)
      .populate("teacher", "fullName email picture city country")
      .populate("student", "fullName email picture phone city country");

    if (!trial) {
      return res.status(404).json({ message: "Trial not found" });
    }

    const isStudent =
      (trial.student?._id || trial.student).toString() === userId;
    const isTeacher =
      (trial.teacher?._id || trial.teacher).toString() === userId;
    const isAdmin = req.user.role?.includes("admin");

    if (!isStudent && !isTeacher && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized to view this trial" });
    }

    const userRole = isTeacher ? "teacher" : "student";
    const timingInfo = await computeTrialStatusAndMeet(trial, userRole);

    return res.status(200).json({
      trial,
      ...timingInfo,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch trial details",
      error: error.message,
    });
  }
}

// GET /api/trials/student - Student fetches their trials
async function getStudentTrials(req, res) {
  try {
    const studentId = req.user._id;
    const { status } = req.query;

    const allTrials = await Trial.find({ student: studentId })
      .populate("teacher", "fullName email picture city country")
      .sort({ updatedAt: -1, createdAt: -1 });

    // Deduplicate: only one instance of a trial (the latest update) per time slot
    const seenSlots = new Set();
    const latestTrials = [];

    for (const t of allTrials) {
      const teacherId = (t.teacher?._id || t.teacher)?.toString();
      const slotKey = `${teacherId}_${(t.day || "").toLowerCase()}_${t.startTime}_${t.endTime}`;
      if (!seenSlots.has(slotKey)) {
        seenSlots.add(slotKey);
        latestTrials.push(t);
      }
    }

    const filtered =
      status && status !== "All"
        ? latestTrials.filter(
            (t) => t.status?.toLowerCase() === status.toLowerCase(),
          )
        : latestTrials;

    // Attach countdown, meetLink, canJoin, canComplete, canCancel
    const enhancedTrials = await Promise.all(
      filtered.map(async (t) => {
        const timingInfo = await computeTrialStatusAndMeet(t, "student");
        const obj = t.toObject ? t.toObject() : { ...t };
        return {
          ...obj,
          ...timingInfo,
        };
      }),
    );

    return res.status(200).json({ trials: enhancedTrials });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch student trials",
      error: error.message,
    });
  }
}

// GET /api/trials/teacher - Teacher fetches their trial requests
async function getTeacherTrials(req, res) {
  try {
    const teacherId = req.user._id;
    const { status } = req.query;

    const allTrials = await Trial.find({ teacher: teacherId })
      .populate("student", "fullName email picture phone city country")
      .sort({ updatedAt: -1, createdAt: -1 });

    // Deduplicate: only one instance of a trial (the latest update) per student time slot
    const seenSlots = new Set();
    const latestTrials = [];

    for (const t of allTrials) {
      const studentId = (t.student?._id || t.student)?.toString();
      const slotKey = `${studentId}_${(t.day || "").toLowerCase()}_${t.startTime}_${t.endTime}`;
      if (!seenSlots.has(slotKey)) {
        seenSlots.add(slotKey);
        latestTrials.push(t);
      }
    }

    const filtered =
      status && status !== "All"
        ? latestTrials.filter(
            (t) => t.status?.toLowerCase() === status.toLowerCase(),
          )
        : latestTrials;

    // Attach countdown, meetLink, canJoin, canComplete, canCancel
    const enhancedTrials = await Promise.all(
      filtered.map(async (t) => {
        const timingInfo = await computeTrialStatusAndMeet(t, "teacher");
        const obj = t.toObject ? t.toObject() : { ...t };
        return {
          ...obj,
          ...timingInfo,
        };
      }),
    );

    return res.status(200).json({ trials: enhancedTrials });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch teacher trials",
      error: error.message,
    });
  }
}

module.exports = {
  createTrial,
  acceptTrial,
  rejectTrial,
  cancelTrial,
  completeTrial,
  getTrialById,
  getStudentTrials,
  getTeacherTrials,
  computeTrialStatusAndMeet,
  getSlotDateTime,
  calculateCountdown,
};
