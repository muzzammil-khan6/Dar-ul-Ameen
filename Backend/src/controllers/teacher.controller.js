const Schedule = require("../models/schedule.model");
const Booking = require("../models/booking.model");
const Class = require("../models/class.model");
const Review = require("../models/review.model");
const Wallet = require("../models/wallet.model");
const Withdraw = require("../models/withdraw.model");
const Auth = require("../models/auth.model");
const Trial = require("../models/trial.model");
const { emitToUser, emitToAdmin } = require("../services/socket.service");
const {
  calculateRateForSubject,
  getCommissionSettings,
} = require("../services/pricing.service");
const { expireOverdueBookings } = require("./booking.controller");

// Helper to calculate gap between slots
function calculateGaps(timeSlots) {
  if (!timeSlots || timeSlots.length === 0) return [];
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const result = [];

  for (const day of days) {
    const daySlots = timeSlots
      .filter((s) => s.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (let i = 0; i < daySlots.length; i++) {
      const current = daySlots[i];
      let gapWithNext = null;
      if (i < daySlots.length - 1) {
        const next = daySlots[i + 1];
        if (current.endTime < next.startTime) {
          gapWithNext = `${current.endTime} - ${next.startTime}`;
        }
      }
      result.push({
        _id: current._id,
        day: current.day,
        startTime: current.startTime,
        endTime: current.endTime,
        gapWithNext,
      });
    }
  }
  return result;
}

// Helper to convert "HH:mm" to minutes
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Helper to fetch schedule with bookedSlots and gap calculations
async function getScheduleData(teacherId) {
  let schedule = await Schedule.findOne({ teacher: teacherId });
  if (!schedule) return null;

  const activeBookings = await Booking.find({
    teacher: teacherId,
    status: {
      $in: [
        "pending",
        "accepted_by_teacher",
        "payment_done, waiting_for_admin",
        "confirmed",
        "active",
      ],
    },
  }).populate("student", "name email");

  const activeTrials = await Trial.find({
    teacher: teacherId,
    status: { $in: ["pending", "accepted"] },
  }).populate("student", "name email");

  const bookedSlots = [];
  for (const b of activeBookings) {
    if (b.timeSlot && b.timeSlot.startTime) {
      bookedSlots.push({
        id: b._id,
        bookingId: b._id,
        type: "Paid Package",
        day: b.timeSlot.day || "All Selected Days",
        startTime: b.timeSlot.startTime,
        endTime: b.timeSlot.endTime,
        subject: b.subject,
        grade: b.grade,
        studentName: b.student?.name || "Student",
        status: b.status,
      });
    }
  }

  for (const t of activeTrials) {
    if (t.startTime) {
      bookedSlots.push({
        id: t._id,
        trialId: t._id,
        type: "Trial Class",
        day: t.day,
        startTime: t.startTime,
        endTime: t.endTime,
        subject: t.subject,
        grade: t.grade,
        studentName: t.student?.name || "Student",
        status: t.status,
      });
    }
  }

  const slotsWithGaps = calculateGaps(schedule.timeSlots);
  const schedObj = schedule.toObject();
  const subjectsWithRates = (schedObj.subjects || []).map((sub) => {
    const rateObj = (schedObj.rates || []).find(
      (r) => r.subjectName?.toLowerCase() === sub.name?.toLowerCase(),
    );
    return {
      ...sub,
      rate: rateObj?.calculatedRate || 0,
    };
  });

  return {
    ...schedObj,
    subjects: subjectsWithRates,
    timeSlots: slotsWithGaps,
    bookedSlots,
  };
}

// GET /api/teacher/schedule - VIEW ONLY (No teacherApprovalMiddleware)
async function getSchedule(req, res) {
  try {
    const teacherId = req.user._id;
    const scheduleData = await getScheduleData(teacherId);

    if (!scheduleData) {
      return res.status(200).json({
        schedule: null,
        bookedSlots: [],
        message: "No schedule found. Please configure your schedule.",
      });
    }

    return res.status(200).json({
      schedule: scheduleData,
      bookedSlots: scheduleData.bookedSlots,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch schedule", error: error.message });
  }
}

// PUT /api/teacher/schedule - EDIT ONLY 5-Step Wizard
async function updateSchedule(req, res) {
  try {
    const teacherId = req.user._id;
    const { subjects, daysPerWeek, selectedDays, duration, timeSlots } =
      req.body;

    // STEP 1 VALIDATION
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one subject is required" });
    }
    for (const sub of subjects) {
      if (!sub.grades || sub.grades.length === 0) {
        return res.status(400).json({
          message: `At least one grade is required for subject ${sub.name}`,
        });
      }
    }

    // STEP 2 & 3 VALIDATION
    const daysNum = Number(daysPerWeek);
    if (!daysNum || daysNum < 1 || daysNum > 7) {
      return res
        .status(400)
        .json({ message: "Days per week must be between 1 and 7" });
    }
    if (!selectedDays || selectedDays.length !== daysNum) {
      return res.status(400).json({
        message: `You selected ${daysNum} days per week, but provided ${
          selectedDays ? selectedDays.length : 0
        } days`,
      });
    }

    // STEP 4 VALIDATION
    const durNum = Number(duration);
    if (![20, 30, 40, 50, 60].includes(durNum)) {
      return res
        .status(400)
        .json({ message: "Duration must be 20, 30, 40, 50, or 60 minutes" });
    }

    // STEP 5: Time Slots (Rule: Any selected time slot is applied to every selected day)
    if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one time slot is required" });
    }

    // Extract distinct timing intervals (startTime - endTime)
    const uniqueTimings = [];
    const seenTimings = new Set();
    for (const slot of timeSlots) {
      if (!slot.startTime || !slot.endTime) continue;
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!seenTimings.has(key)) {
        seenTimings.add(key);
        uniqueTimings.push({ startTime: slot.startTime, endTime: slot.endTime });
      }
    }

    if (uniqueTimings.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one valid time slot is required" });
    }

    // Validate each timing interval duration against class duration
    for (const timing of uniqueTimings) {
      const startMin = timeToMinutes(timing.startTime);
      const endMin = timeToMinutes(timing.endTime);
      const slotDuration = endMin - startMin;

      if (slotDuration <= durNum) {
        return res.status(400).json({
          message: `Slot duration (${slotDuration} mins: ${timing.startTime}-${timing.endTime}) must be more than class duration (${durNum} mins)`,
        });
      }
    }

    // Check for overlapping timing intervals
    for (let i = 0; i < uniqueTimings.length; i++) {
      for (let j = i + 1; j < uniqueTimings.length; j++) {
        const aStart = timeToMinutes(uniqueTimings[i].startTime);
        const aEnd = timeToMinutes(uniqueTimings[i].endTime);
        const bStart = timeToMinutes(uniqueTimings[j].startTime);
        const bEnd = timeToMinutes(uniqueTimings[j].endTime);

        if (Math.max(aStart, bStart) < Math.min(aEnd, bEnd)) {
          return res.status(400).json({
            message: `Time slots overlap: ${uniqueTimings[i].startTime}-${uniqueTimings[i].endTime} and ${uniqueTimings[j].startTime}-${uniqueTimings[j].endTime}`,
          });
        }
      }
    }

    // System rule: Synchronize and apply any selected time slot to EVERY selected day
    const synchronizedSlots = [];
    for (const day of selectedDays) {
      for (const timing of uniqueTimings) {
        synchronizedSlots.push({
          day,
          startTime: timing.startTime,
          endTime: timing.endTime,
        });
      }
    }

    // Compute automatic rates for each subject
    const calculatedRates = [];
    for (const sub of subjects) {
      const rate = await calculateRateForSubject(sub.name, daysNum, durNum);
      calculatedRates.push({
        subjectName: sub.name,
        calculatedRate: rate,
      });
    }

    // Check teacher's current status: ensure teaching status is NOT changed to pending after schedule changes
    const currentTeacher = await Auth.findById(teacherId);
    const existingSchedule = await Schedule.findOne({ teacher: teacherId });
    const isApproved =
      currentTeacher?.teachingStatus === "approved" ||
      req.user?.teachingStatus === "approved" ||
      Boolean(existingSchedule?.isApproved);

    // Save schedule (retain approval status if teacher is already approved)
    await Schedule.findOneAndUpdate(
      { teacher: teacherId },
      {
        teacher: teacherId,
        subjects,
        daysPerWeek: daysNum,
        selectedDays,
        duration: durNum,
        timeSlots: synchronizedSlots,
        rates: calculatedRates,
        isApproved,
      },
      { new: true, upsert: true },
    );

    // Ensure teaching status is NOT changed to pending after schedule changes!
    // Teacher's current teachingStatus is preserved.
    const scheduleData = await getScheduleData(teacherId);

    return res.status(200).json({
      message: "Schedule updated successfully!",
      schedule: scheduleData,
      bookedSlots: scheduleData?.bookedSlots || [],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update schedule", error: error.message });
  }
}

// POST /api/teacher/schedule/card - Add or update a subject card
async function addOrUpdateSubjectCard(req, res) {
  try {
    const teacherId = req.user._id;
    const { name, grades, duration, rate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Subject name is required" });
    }
    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one grade is required for this subject" });
    }

    let schedule = await Schedule.findOne({ teacher: teacherId });
    if (!schedule) {
      const dur = [20, 30, 40, 50, 60].includes(Number(duration))
        ? Number(duration)
        : 30;
      const daysNum = 3;
      const defaultDays = ["Monday", "Wednesday", "Friday"];
      const defaultSlots = [];
      for (const day of defaultDays) {
        defaultSlots.push({ day, startTime: "16:00", endTime: "18:00" });
      }

      const calculatedRate = (rate && Number(rate) > 0)
        ? Number(rate)
        : await calculateRateForSubject(
            name.trim(),
            daysNum,
            dur,
          );
      const isApproved = req.user?.teachingStatus === "approved";

      schedule = await Schedule.create({
        teacher: teacherId,
        subjects: [{ name: name.trim(), grades }],
        daysPerWeek: daysNum,
        selectedDays: defaultDays,
        duration: dur,
        timeSlots: defaultSlots,
        rates: [{ subjectName: name.trim(), calculatedRate }],
        isApproved,
      });
    } else {
      if (duration && [20, 30, 40, 50, 60].includes(Number(duration))) {
        schedule.duration = Number(duration);
      }

      const existingIdx = schedule.subjects.findIndex(
        (s) => s.name.toLowerCase() === name.trim().toLowerCase(),
      );

      if (existingIdx >= 0) {
        schedule.subjects[existingIdx].grades = grades;
      } else {
        schedule.subjects.push({ name: name.trim(), grades });
      }

      // Recalculate rates for all subjects
      const calculatedRates = [];
      for (const sub of schedule.subjects) {
        let subRate = await calculateRateForSubject(
          sub.name,
          schedule.daysPerWeek,
          schedule.duration,
        );
        // If custom rate was submitted for this subject, use it
        if (
          sub.name.toLowerCase() === name.trim().toLowerCase() &&
          rate &&
          Number(rate) > 0
        ) {
          subRate = Number(rate);
        }
        calculatedRates.push({
          subjectName: sub.name,
          calculatedRate: subRate,
        });
      }
      schedule.rates = calculatedRates;
      await schedule.save();
    }

    const scheduleData = await getScheduleData(teacherId);
    return res.status(200).json({
      message: "Subject card saved successfully",
      schedule: scheduleData,
      bookedSlots: scheduleData?.bookedSlots || [],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to save subject card", error: error.message });
  }
}

// DELETE /api/teacher/schedule/card/:subjectName - Delete a subject card
async function deleteSubjectCard(req, res) {
  try {
    const teacherId = req.user._id;
    const { subjectName } = req.params;

    const schedule = await Schedule.findOne({ teacher: teacherId });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    if (schedule.subjects.length <= 1) {
      return res.status(400).json({
        message:
          "You must have at least one teaching subject. You cannot delete the only subject.",
      });
    }

    // Check active bookings or trials
    const activeBooking = await Booking.findOne({
      teacher: teacherId,
      subject: { $regex: new RegExp(`^${subjectName}$`, "i") },
      status: {
        $in: [
          "pending",
          "accepted_by_teacher",
          "payment_done, waiting_for_admin",
          "confirmed",
          "active",
        ],
      },
    });
    const activeTrial = await Trial.findOne({
      teacher: teacherId,
      subject: { $regex: new RegExp(`^${subjectName}$`, "i") },
      status: { $in: ["pending", "accepted"] },
    });

    if (activeBooking || activeTrial) {
      return res.status(400).json({
        message: `Cannot delete subject "${subjectName}" because there are active bookings or trial requests for it!`,
      });
    }

    schedule.subjects = schedule.subjects.filter(
      (s) => s.name.toLowerCase() !== subjectName.toLowerCase(),
    );
    schedule.rates = schedule.rates.filter(
      (r) => r.subjectName.toLowerCase() !== subjectName.toLowerCase(),
    );

    await schedule.save();

    const scheduleData = await getScheduleData(teacherId);
    return res.status(200).json({
      message: `Subject "${subjectName}" deleted successfully`,
      schedule: scheduleData,
      bookedSlots: scheduleData?.bookedSlots || [],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete subject card", error: error.message });
  }
}

// PUT /api/teacher/schedule/days - Update days per week and selected days
async function updateDays(req, res) {
  try {
    const teacherId = req.user._id;
    const { daysPerWeek, selectedDays } = req.body;

    const daysNum = Number(daysPerWeek);
    if (!daysNum || daysNum < 1 || daysNum > 7) {
      return res
        .status(400)
        .json({ message: "Days per week must be between 1 and 7" });
    }
    if (!selectedDays || selectedDays.length !== daysNum) {
      return res.status(400).json({
        message: `You selected ${daysNum} days per week, but provided ${
          selectedDays ? selectedDays.length : 0
        } days`,
      });
    }

    const schedule = await Schedule.findOne({ teacher: teacherId });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Extract unique timing intervals
    const uniqueTimings = [];
    const seen = new Set();
    for (const slot of schedule.timeSlots) {
      if (!slot.startTime || !slot.endTime) continue;
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTimings.push({ startTime: slot.startTime, endTime: slot.endTime });
      }
    }

    // Re-synchronize timeSlots across new selectedDays
    const synchronizedSlots = [];
    for (const day of selectedDays) {
      for (const timing of uniqueTimings) {
        synchronizedSlots.push({
          day,
          startTime: timing.startTime,
          endTime: timing.endTime,
        });
      }
    }

    // Recalculate rates for all subjects based on new daysPerWeek
    const calculatedRates = [];
    for (const sub of schedule.subjects) {
      const rate = await calculateRateForSubject(
        sub.name,
        daysNum,
        schedule.duration,
      );
      calculatedRates.push({
        subjectName: sub.name,
        calculatedRate: rate,
      });
    }

    schedule.daysPerWeek = daysNum;
    schedule.selectedDays = selectedDays;
    schedule.timeSlots = synchronizedSlots;
    schedule.rates = calculatedRates;

    await schedule.save();

    const scheduleData = await getScheduleData(teacherId);
    return res.status(200).json({
      message: "Teaching days updated successfully",
      schedule: scheduleData,
      bookedSlots: scheduleData?.bookedSlots || [],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update days", error: error.message });
  }
}

// POST /api/teacher/schedule/slot - Add a new time slot
async function addSlot(req, res) {
  try {
    const teacherId = req.user._id;
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "Start time and end time are required" });
    }

    const schedule = await Schedule.findOne({ teacher: teacherId });
    if (!schedule) {
      return res
        .status(404)
        .json({ message: "Schedule not found. Please create a schedule first." });
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const slotDuration = endMin - startMin;

    if (slotDuration <= 0) {
      return res
        .status(400)
        .json({ message: "End time must be after start time" });
    }

    if (slotDuration <= schedule.duration) {
      return res.status(400).json({
        message: `Slot duration (${slotDuration} mins: ${startTime}-${endTime}) must be greater than class duration (${schedule.duration} mins)`,
      });
    }

    // Check overlap with existing unique timings
    const uniqueTimings = [];
    const seen = new Set();
    for (const slot of schedule.timeSlots) {
      if (!slot.startTime || !slot.endTime) continue;
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTimings.push({ startTime: slot.startTime, endTime: slot.endTime });
      }
    }

    for (const timing of uniqueTimings) {
      const aStart = timeToMinutes(timing.startTime);
      const aEnd = timeToMinutes(timing.endTime);

      if (Math.max(aStart, startMin) < Math.min(aEnd, endMin)) {
        return res.status(400).json({
          message: `Time slot overlaps with existing slot: ${timing.startTime} - ${timing.endTime}`,
        });
      }
    }

    // Apply new slot across every selected day
    for (const day of schedule.selectedDays) {
      schedule.timeSlots.push({
        day,
        startTime,
        endTime,
      });
    }

    await schedule.save();

    const scheduleData = await getScheduleData(teacherId);
    return res.status(200).json({
      message: "Time slot added successfully across all teaching days",
      schedule: scheduleData,
      bookedSlots: scheduleData?.bookedSlots || [],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to add time slot", error: error.message });
  }
}

// DELETE /api/teacher/schedule/slot/:id
async function deleteSlot(req, res) {
  try {
    const teacherId = req.user._id;
    const slotId = req.params.id;

    const schedule = await Schedule.findOne({ teacher: teacherId });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const targetSlot = schedule.timeSlots.find(
      (s) => s._id.toString() === slotId,
    );

    if (targetSlot) {
      // Check if slot has active bookings or trials
      const activeBooking = await Booking.findOne({
        teacher: teacherId,
        "timeSlot.startTime": targetSlot.startTime,
        "timeSlot.endTime": targetSlot.endTime,
        status: {
          $in: [
            "pending",
            "accepted_by_teacher",
            "payment_done, waiting_for_admin",
            "confirmed",
            "active",
          ],
        },
      });
      const activeTrial = await Trial.findOne({
        teacher: teacherId,
        startTime: targetSlot.startTime,
        endTime: targetSlot.endTime,
        status: { $in: ["pending", "accepted"] },
      });

      if (activeBooking || activeTrial) {
        return res.status(400).json({
          message: `Cannot delete time slot (${targetSlot.startTime} - ${targetSlot.endTime}) because it currently has active bookings or trial requests!`,
        });
      }

      // Remove this time slot (startTime-endTime) across every day to uphold the rule
      schedule.timeSlots = schedule.timeSlots.filter(
        (s) =>
          !(
            s.startTime === targetSlot.startTime &&
            s.endTime === targetSlot.endTime
          ),
      );
    } else {
      schedule.timeSlots = schedule.timeSlots.filter(
        (s) => s._id.toString() !== slotId,
      );
    }
    await schedule.save();

    const scheduleData = await getScheduleData(teacherId);
    return res.status(200).json({
      message: "Time slot deleted successfully from all days",
      timeSlots: scheduleData?.timeSlots || [],
      schedule: scheduleData,
      bookedSlots: scheduleData?.bookedSlots || [],
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete slot", error: error.message });
  }
}

// GET /api/teacher/dashboard (TeacherApprovalMiddleware)
async function getDashboard(req, res) {
  try {
    const teacherId = req.user._id;
    await expireOverdueBookings();

    // 1. Earnings calculation
    const completedWallets = await Wallet.find({
      user: teacherId,
      type: "earning",
      status: "available",
    });
    const approvedWithdraws = await Withdraw.find({
      teacher: teacherId,
      status: "approved",
    });
    const pendingWallets = await Wallet.find({
      user: teacherId,
      type: "earning",
      status: "pending",
    });

    const totalEarned = completedWallets.reduce((acc, curr) => acc + curr.amount, 0);
    const totalWithdrawn = approvedWithdraws.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );
    const availableBalance = Math.max(0, totalEarned - totalWithdrawn);
    const pendingBalance = pendingWallets.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );

    // 2. Upcoming classes:
    // a) Trial Classes where Trial Status = accepted AND date >= today
    // b) Paid Classes where Booking Status = active (Payment Done) AND Class Status = scheduled AND Class Date >= today
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const trialClasses = await Trial.find({
      teacher: teacherId,
      status: "accepted",
      date: { $gte: today },
    })
      .populate("student", "fullName email picture")
      .sort({ date: 1, startTime: 1 });

    const formattedTrials = trialClasses.map((t) => ({
      _id: t._id,
      isTrial: true,
      type: "trial",
      subject: t.subject,
      grade: t.grade,
      date: t.date,
      day: t.day,
      startTime: t.startTime,
      endTime: t.endTime,
      duration: t.duration,
      student: t.student,
      status: t.status,
    }));

    const activeBookings = await Booking.find({
      teacher: teacherId,
      status: "active",
    }).select("_id subject grade");

    const activeBookingIds = activeBookings.map((b) => b._id);

    const paidClasses = await Class.find({
      teacher: teacherId,
      booking: { $in: activeBookingIds },
      status: "scheduled",
      date: { $gte: today },
    })
      .populate("student", "fullName email picture")
      .populate("booking", "subject grade")
      .sort({ date: 1, startTime: 1 });

    const formattedPaid = paidClasses.map((c) => ({
      _id: c._id,
      isTrial: false,
      type: "paid",
      booking: c.booking,
      subject: c.booking?.subject,
      grade: c.booking?.grade,
      date: c.date,
      day: c.day,
      startTime: c.startTime,
      endTime: c.endTime,
      student: c.student,
      status: c.status,
    }));

    const allUpcoming = [...formattedTrials, ...formattedPaid].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.startTime.localeCompare(b.startTime);
    });

    const upcomingClasses = allUpcoming.slice(0, 5);

    // 3. Total unique students
    const distinctStudents = await Booking.distinct("student", {
      teacher: teacherId,
      status: { $in: ["confirmed", "active", "completed"] },
    });

    // 4. Recent bookings (cancelled bookings are never displayed in Teacher Portal)
    const recentBookings = await Booking.find({
      teacher: teacherId,
      status: { $ne: "cancelled" },
    })
      .populate("student", "fullName email picture")
      .sort({ createdAt: -1 })
      .limit(5);

    // Commission setting
    const settings = await getCommissionSettings();

    return res.status(200).json({
      stats: {
        totalEarned,
        availableBalance,
        pendingBalance,
        totalWithdrawn,
        totalStudents: distinctStudents.length,
        commissionPercentage: settings.commissionPercentage,
      },
      upcomingClasses,
      recentBookings,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load dashboard", error: error.message });
  }
}

// GET /api/teacher/bookings (TeacherApprovalMiddleware)
async function getBookings(req, res) {
  try {
    const teacherId = req.user._id;
    const { status, page, limit } = req.query;

    await expireOverdueBookings();

    const query = { teacher: teacherId };
    if (status && status !== "All") {
      query.status = status.toLowerCase();
    } else {
      // By default in Teacher Portal, cancelled bookings are not displayed
      query.status = { $ne: "cancelled" };
    }

    // Cancelled bookings must never be displayed in the Teacher Portal
    if (query.status === "cancelled") {
      return res.status(200).json({ bookings: [], total: 0 });
    }

    const allBookings = await Booking.find(query)
      .populate("student", "fullName email picture phone city country")
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    // Deduplicate: only one instance of a booking (the latest update) per student time slot
    const seenBookingSlots = new Set();
    const latestBookings = [];

    for (const b of allBookings) {
      const studentId = (b.student?._id || b.student)?.toString();
      const startTime = b.timeSlot?.startTime || "";
      const endTime = b.timeSlot?.endTime || "";
      const slotKey = `${studentId}_${startTime}_${endTime}`;

      if (!seenBookingSlots.has(slotKey)) {
        seenBookingSlots.add(slotKey);
        latestBookings.push(b);
      }
    }

    // Attach classes to each booking
    const bookingIds = latestBookings.map((b) => b._id);
    const classes = await Class.find({ booking: { $in: bookingIds } })
      .sort({ date: 1, startTime: 1 })
      .lean();

    // Group classes by booking id for O(1) lookup
    const classesByBooking = {};
    for (const c of classes) {
      const bId = c.booking.toString();
      if (!classesByBooking[bId]) classesByBooking[bId] = [];
      classesByBooking[bId].push(c);
    }

    const enriched = latestBookings.map((b) => {
      const bId = b._id.toString();
      b.classes = classesByBooking[bId] || [];
      return b;
    });

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (!isNaN(pageNum) && !isNaN(limitNum) && limitNum > 0) {
      const startIndex = (pageNum - 1) * limitNum;
      const paginated = enriched.slice(startIndex, startIndex + limitNum);
      return res.status(200).json({
        bookings: paginated,
        total: enriched.length,
        page: pageNum,
        totalPages: Math.ceil(enriched.length / limitNum),
      });
    }

    return res.status(200).json({ bookings: enriched, total: enriched.length });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
}

// GET /api/teacher/wallet (TeacherApprovalMiddleware)
async function getWallet(req, res) {
  try {
    const teacherId = req.user._id;

    const completedWallets = await Wallet.find({
      user: teacherId,
      type: "earning",
      status: "available",
    });
    const approvedWithdraws = await Withdraw.find({
      teacher: teacherId,
      status: "approved",
    });
    const pendingWallets = await Wallet.find({
      user: teacherId,
      type: "earning",
      status: "pending",
    });

    const totalEarned = completedWallets.reduce((acc, curr) => acc + curr.amount, 0);
    const totalWithdrawn = approvedWithdraws.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );
    const balance = Math.max(0, totalEarned - totalWithdrawn);
    const pendingBalance = pendingWallets.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );

    const withdrawals = await Withdraw.find({ teacher: teacherId }).sort({
      createdAt: -1,
    });
    const ledger = await Wallet.find({ user: teacherId })
      .populate("booking", "subject grade totalPrice teacherShare")
      .sort({ createdAt: -1 });

    const settings = await getCommissionSettings();

    return res.status(200).json({
      balance,
      pendingBalance,
      totalEarned,
      totalWithdrawn,
      minWithdrawal: settings?.minWithdrawal || 500,
      commissionPercentage: settings?.commissionPercentage ?? 20,
      platformName: settings?.platformName || "Dar-ul-Ameen Tutor Platform",
      withdrawals,
      ledger,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch wallet", error: error.message });
  }
}

// POST /api/teacher/wallet/withdraw (TeacherApprovalMiddleware)
async function requestWithdraw(req, res) {
  try {
    const teacherId = req.user._id;
    const { amount, accountDetails } = req.body;
    const reqAmount = Number(amount);

    const settings = await getCommissionSettings();
    const minThreshold = Number(settings?.minWithdrawal) || 500;

    if (!reqAmount || reqAmount < minThreshold) {
      return res
        .status(400)
        .json({ message: `Minimum withdrawal amount is ${minThreshold} PKR as per platform system preferences.` });
    }
    if (!accountDetails || !accountDetails.trim()) {
      return res
        .status(400)
        .json({ message: "Payment/Bank account details are required" });
    }

    // Verify balance
    const completedWallets = await Wallet.find({
      user: teacherId,
      type: "earning",
      status: "available",
    });
    const approvedWithdraws = await Withdraw.find({
      teacher: teacherId,
      status: "approved",
    });
    const pendingWithdraws = await Withdraw.find({
      teacher: teacherId,
      status: "pending",
    });

    const totalEarned = completedWallets.reduce((acc, curr) => acc + curr.amount, 0);
    const totalWithdrawn = approvedWithdraws.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );
    const pendingWithdrawn = pendingWithdraws.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );
    const currentAvailable = Math.max(
      0,
      totalEarned - totalWithdrawn - pendingWithdrawn,
    );

    if (reqAmount > currentAvailable) {
      return res.status(400).json({
        message: `Insufficient balance. Available to withdraw: ${currentAvailable}`,
      });
    }

    const withdrawDoc = await Withdraw.create({
      teacher: teacherId,
      amount: reqAmount,
      accountDetails,
      status: "pending",
    });

    emitToAdmin("walletUpdated", {
      withdraw: withdrawDoc,
      action: "withdraw_requested",
      message: `New Withdrawal Request from teacher for PKR ${reqAmount}`,
    });
    emitToUser(teacherId, "walletUpdated", {
      withdraw: withdrawDoc,
      action: "withdraw_requested",
      message: "Withdrawal request submitted.",
    });

    return res.status(201).json({
      message: "Withdrawal request submitted successfully",
      withdraw: withdrawDoc,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Withdrawal request failed",
      error: error.message,
    });
  }
}

// GET /api/teacher/reviews (TeacherApprovalMiddleware)
async function getReviews(req, res) {
  try {
    const teacherId = req.user._id;
    const reviews = await Review.find({ teacher: teacherId })
      .populate("student", "fullName picture")
      .populate("booking", "subject grade")
      .sort({ createdAt: -1 });

    const avgRating =
      reviews.length > 0
        ? (
            reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
          ).toFixed(1)
        : "5.0";

    return res.status(200).json({
      reviews,
      avgRating: Number(avgRating),
      totalReviews: reviews.length,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch reviews", error: error.message });
  }
}

module.exports = {
  getSchedule,
  updateSchedule,
  deleteSlot,
  addOrUpdateSubjectCard,
  deleteSubjectCard,
  updateDays,
  addSlot,
  getDashboard,
  getBookings,
  getWallet,
  requestWithdraw,
  getReviews,
};
