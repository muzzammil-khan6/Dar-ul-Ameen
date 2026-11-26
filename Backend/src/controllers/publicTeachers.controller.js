const Auth = require("../models/auth.model");
const Schedule = require("../models/schedule.model");
const Review = require("../models/review.model");
const Class = require("../models/class.model");
const Booking = require("../models/booking.model");
const Trial = require("../models/trial.model");
const sessionsModel = require("../models/sessions.model");
const {
  splitSlotIntoSeats,
  checkTimeOverlap,
} = require("../utils/seatHelper");
const { calculateRateForSubject } = require("../services/pricing.service");

// Fast in-memory cache for teacher listing (TTL: 60 seconds)
const teachersCache = new Map();
const TEACHERS_CACHE_TTL = 60 * 1000;

function invalidatePublicTeachersCache() {
  teachersCache.clear();
}

// GET /api/teachers - Filterable list of approved teachers
async function getTeachers(req, res) {
  try {
    const cacheKey = JSON.stringify({ query: req.query, userId: req.user?._id });
    const cached = teachersCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < TEACHERS_CACHE_TTL) {
      return res.status(200).json(cached.data);
    }

    const {
      subject,
      grade,
      city,
      daysPerWeek,
      duration,
      minPrice,
      maxPrice,
      rating,
      search,
      day,
    } = req.query;

    // 1. Base query for approved teachers
    const userQuery = {
      role: "teacher",
      teachingStatus: "approved",
      isBlocked: { $ne: true },
    };

    if (city && city !== "All") {
      userQuery.city = { $regex: new RegExp(`^${city}$`, "i") };
    }

    if (search && search.trim()) {
      userQuery.fullName = { $regex: new RegExp(search.trim(), "i") };
    }

    const teachers = await Auth.find(userQuery)
      .select("fullName email city country picture bio preferredLanguage teachingStatus")
      .lean();

    const teacherIds = teachers.map((t) => t._id);

    // 2. Fetch schedules for these teachers
    const scheduleQuery = { teacher: { $in: teacherIds } };

    if (daysPerWeek && daysPerWeek !== "All") {
      scheduleQuery.daysPerWeek = Number(daysPerWeek);
    }
    if (duration && duration !== "All") {
      scheduleQuery.duration = Number(duration);
    }

    const schedules = await Schedule.find(scheduleQuery).lean();
    const scheduleMap = new Map();
    for (const s of schedules) {
      scheduleMap.set(s.teacher.toString(), s);
    }

    // 3. Fetch reviews for rating calculation
    const reviews = await Review.find({ teacher: { $in: teacherIds } })
      .select("teacher rating")
      .lean();
    const ratingsMap = new Map();
    for (const r of reviews) {
      const tId = r.teacher.toString();
      if (!ratingsMap.has(tId)) {
        ratingsMap.set(tId, []);
      }
      ratingsMap.get(tId).push(r.rating);
    }

    // 4. Fetch latest session for each teacher to determine lastActive
    const sessions = await sessionsModel.aggregate([
      { $match: { userID: { $in: teacherIds } } },
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: "$userID",
          lastActive: { $first: "$updatedAt" },
        },
      },
    ]);
    const sessionMap = new Map();
    for (const s of sessions) {
      sessionMap.set(s._id.toString(), s.lastActive);
    }

    // 5. If user is authenticated student, check active applications (bookings and trials)
    const userActiveBookingsMap = new Map();
    const isStudentUser =
      req.user &&
      (Array.isArray(req.user.role)
        ? req.user.role.includes("student")
        : req.user.role === "student");
    if (isStudentUser) {
      const activeBookings = await Booking.find({
        student: req.user._id,
        teacher: { $in: teacherIds },
        status: {
          $in: [
            "pending",
            "accepted_by_teacher",
            "payment_done, waiting_for_admin",
            "active",
            "confirmed",
          ],
        },
      }).select("teacher status timeSlot subject grade");
      for (const b of activeBookings) {
        const tIdStr = b.teacher.toString();
        if (!userActiveBookingsMap.has(tIdStr)) {
          userActiveBookingsMap.set(tIdStr, []);
        }
        userActiveBookingsMap.get(tIdStr).push({
          bookingId: b._id,
          isTrial: false,
          status: b.status,
          timeSlot: b.timeSlot,
          subject: b.subject,
          grade: b.grade,
        });
      }

      const activeStudentTrials = await Trial.find({
        student: req.user._id,
        teacher: { $in: teacherIds },
        status: { $in: ["pending", "accepted"] },
      }).select("teacher status startTime endTime day subject grade");
      for (const t of activeStudentTrials) {
        const tIdStr = t.teacher.toString();
        if (!userActiveBookingsMap.has(tIdStr)) {
          userActiveBookingsMap.set(tIdStr, []);
        }
        userActiveBookingsMap.get(tIdStr).push({
          trialId: t._id,
          isTrial: true,
          status: t.status,
          timeSlot: { startTime: t.startTime, endTime: t.endTime, day: t.day },
          subject: t.subject,
          grade: t.grade,
        });
      }
    }

    // 5. Combine and filter
    const result = [];

    for (const teacher of teachers) {
      const tId = teacher._id.toString();
      const schedule = scheduleMap.get(tId);

      // Must have schedule to appear in public list
      if (!schedule) continue;

      // Filter by day (e.g., Monday, Tuesday, etc.)
      if (day && day !== "All") {
        const hasDay = schedule.selectedDays?.some(
          (d) => d.toLowerCase() === day.toLowerCase(),
        );
        if (!hasDay) continue;
      }

      // Filter by subject
      if (subject && subject !== "All") {
        const hasSub = schedule.subjects.some(
          (s) => s.name.toLowerCase() === subject.toLowerCase(),
        );
        if (!hasSub) continue;
      }

      // Filter by grade
      if (grade && grade !== "All") {
        const hasGrade = schedule.subjects.some((s) =>
          s.grades.some((g) => g.toLowerCase() === grade.toLowerCase()),
        );
        if (!hasGrade) continue;
      }

      // Filter by Price range
      if (minPrice || maxPrice) {
        const rates = schedule.rates.map((r) => r.calculatedRate);
        const minRate = Math.min(...rates);
        const maxRate = Math.max(...rates);

        if (minPrice && minPrice !== "All" && maxRate < Number(minPrice)) {
          continue;
        }
        if (maxPrice && maxPrice !== "All" && minRate > Number(maxPrice)) {
          continue;
        }
      }

      // Rating calculation
      const tRatings = ratingsMap.get(tId) || [];
      const avgRating =
        tRatings.length > 0
          ? Number((tRatings.reduce((a, b) => a + b, 0) / tRatings.length).toFixed(1))
          : 5.0;

      // Filter by rating
      if (rating && rating !== "All") {
        const requiredRating = Number(rating.replace("+", ""));
        if (avgRating < requiredRating) continue;
      }

      // Determine last active time
      const lastActive =
        sessionMap.get(tId) ||
        schedule.updatedAt ||
        teacher.createdAt ||
        new Date();

      const userBookingsForTeacher = userActiveBookingsMap.get(tId) || [];
      const hasActive = userBookingsForTeacher.length > 0;

      // Compute monthly calculated rate for each subject (4 weeks)
      let computedRates = [];
      for (const sub of schedule.subjects || []) {
        const calc = await calculateRateForSubject(sub.name, schedule.daysPerWeek, schedule.duration);
        computedRates.push({ subjectName: sub.name, calculatedRate: calc });
      }

      result.push({
        _id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
        city: teacher.city,
        country: teacher.country,
        picture: teacher.picture,
        bio: teacher.bio,
        preferredLanguage: teacher.preferredLanguage,
        schedule: {
          daysPerWeek: schedule.daysPerWeek,
          selectedDays: schedule.selectedDays,
          duration: schedule.duration,
          subjects: schedule.subjects,
          rates: computedRates,
        },
        avgRating,
        totalReviews: tRatings.length,
        lastActive,
        hasActiveApplication: hasActive,
        activeBookingsCount: userBookingsForTeacher.length,
        activeApplicationStatus: userBookingsForTeacher[0]?.status || null,
        activeBookingId: userBookingsForTeacher[0]?.bookingId || null,
        activeBookings: userBookingsForTeacher,
      });
    }

    const payload = {
      count: result.length,
      teachers: result,
    };
    teachersCache.set(cacheKey, { timestamp: Date.now(), data: payload });
    return res.status(200).json(payload);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch teachers", error: error.message });
  }
}

// GET /api/teachers/:id - Teacher Public Profile
async function getTeacherById(req, res) {
  try {
    const teacherId = req.params.id;

    const teacher = await Auth.findOne({
      _id: teacherId,
      role: "teacher",
      teachingStatus: "approved",
      isBlocked: { $ne: true },
    }).select(
      "fullName email city country picture bio preferredLanguage teachingStatus",
    );

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found or not approved" });
    }

    const schedule = await Schedule.findOne({ teacher: teacherId });
    const reviews = await Review.find({ teacher: teacherId })
      .populate("student", "fullName picture")
      .sort({ createdAt: -1 });

    const avgRating =
      reviews.length > 0
        ? Number(
            (
              reviews.reduce((a, b) => a + b.rating, 0) / reviews.length
            ).toFixed(1),
          )
        : 5.0;

    const totalClassesCompleted = await Class.countDocuments({
      teacher: teacherId,
      status: "completed",
    });

    const latestSession = await sessionsModel
      .findOne({ userID: teacherId })
      .sort({ updatedAt: -1 });
    const lastActive =
      latestSession?.updatedAt ||
      schedule?.updatedAt ||
      teacher.createdAt ||
      new Date();

    let existingBooking = null;
    let studentActiveBookings = [];
    let existingTrial = null;
    let studentTrials = [];
    const isStudentUser =
      req.user &&
      (Array.isArray(req.user.role)
        ? req.user.role.includes("student")
        : req.user.role === "student");
    if (isStudentUser) {
      studentActiveBookings = await Booking.find({
        student: req.user._id,
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
      }).select("_id status subject grade startDate timeSlot createdAt");

      studentTrials = await Trial.find({
        student: req.user._id,
        teacher: teacherId,
        status: { $in: ["pending", "accepted", "completed"] },
      }).select("_id status subject grade day date startTime endTime duration createdAt");

      const querySubject = req.query.subject?.trim()?.toLowerCase();
      if (querySubject) {
        existingBooking =
          studentActiveBookings.find(
            (b) => b.subject?.toLowerCase() === querySubject,
          ) ||
          studentActiveBookings[0] ||
          null;
        existingTrial =
          studentTrials.find(
            (t) => t.subject?.toLowerCase() === querySubject,
          ) || null;
      } else {
        existingBooking = studentActiveBookings[0] || null;
        existingTrial = studentTrials[0] || null;
      }
    }

    // RULE 4 & 7: Split slots into seats by teacher duration, and filter out booked seats
    // Fetch active trials and bookings for this teacher to determine booked seats
    const activeTrials = await Trial.find({
      teacher: teacherId,
      status: { $in: ["pending", "accepted"] },
    });
    const activePaidBookings = await Booking.find({
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

    const duration = schedule?.duration || 30;
    const selectedDays = schedule?.selectedDays || [];
    const availableSeatsByDay = {};
    selectedDays.forEach((d) => {
      availableSeatsByDay[d] = [];
    });

    // Map candidate seats per day from teacher's configured timeSlots
    const daySeatMap = new Map();
    selectedDays.forEach((d) => daySeatMap.set(d, []));

    if (schedule?.timeSlots && schedule.timeSlots.length > 0) {
      for (const slot of schedule.timeSlots) {
        if (!selectedDays.includes(slot.day)) continue;

        // Split slot into seats (leftover rule: < duration ignored)
        const seats = splitSlotIntoSeats(slot, duration);

        for (const seat of seats) {
          // Avoid duplicate seats in candidate day list
          const currentDayList = daySeatMap.get(seat.day) || [];
          if (
            !currentDayList.some(
              (s) => s.startTime === seat.startTime && s.endTime === seat.endTime,
            )
          ) {
            currentDayList.push(seat);
            daySeatMap.set(seat.day, currentDayList);
          }

          // Check if seat is blocked for Trial on this specific day:
          // Any active trial or paid booking blocks this seat for a new trial
          const trialBlocked = activeTrials.some(
            (t) =>
              t.day === seat.day &&
              checkTimeOverlap(seat.startTime, seat.endTime, t.startTime, t.endTime),
          );

          const paidBlocked = activePaidBookings.some(
            (b) =>
              b.timeSlot &&
              checkTimeOverlap(seat.startTime, seat.endTime, b.timeSlot.startTime, b.timeSlot.endTime),
          );

          if (!trialBlocked && !paidBlocked) {
            if (!availableSeatsByDay[seat.day]) {
              availableSeatsByDay[seat.day] = [];
            }
            const exists = availableSeatsByDay[seat.day].some(
              (s) => s.startTime === seat.startTime && s.endTime === seat.endTime,
            );
            if (!exists) {
              availableSeatsByDay[seat.day].push(seat);
            }
          }
        }
      }
    }

    // Sort trial seats chronologically for each day
    Object.keys(availableSeatsByDay).forEach((d) => {
      availableSeatsByDay[d].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    // Compute distinct Paid Seats (must be configured on ALL selectedDays of the teacher and not blocked)
    // Rule: An active trial blocks other students, but does NOT block the student holding that trial
    // from submitting the paid package request for their time slot ("There should be no request other than the paid request for this for the same time slot").
    const candidatePaidSeats = new Map();
    selectedDays.forEach((d) => {
      (daySeatMap.get(d) || []).forEach((s) => {
        const key = `${s.startTime}-${s.endTime}`;
        candidatePaidSeats.set(key, s);
      });
    });

    const availablePaidSeats = [];
    candidatePaidSeats.forEach((seat, key) => {
      // Must be configured on EVERY day in selectedDays and free for paid booking
      const availableOnAllDays = selectedDays.every((d) => {
        const configuredOnDay = (daySeatMap.get(d) || []).some(
          (s) => s.startTime === seat.startTime && s.endTime === seat.endTime,
        );
        if (!configuredOnDay) return false;

        // Blocked if any active paid booking overlaps this seat
        const isPaidBookingConflict = activePaidBookings.some(
          (b) =>
            b.timeSlot &&
            checkTimeOverlap(
              seat.startTime,
              seat.endTime,
              b.timeSlot.startTime,
              b.timeSlot.endTime,
            ),
        );
        if (isPaidBookingConflict) return false;

        // Blocked if an active trial overlaps on this day, UNLESS it belongs to the current student
        const isTrialConflict = activeTrials.some((t) => {
          if (t.day !== d) return false;
          const overlaps = checkTimeOverlap(
            seat.startTime,
            seat.endTime,
            t.startTime,
            t.endTime,
          );
          if (!overlaps) return false;
          // If this active trial belongs to the logged-in student, it does not block them from booking paid!
          if (isStudentUser && t.student.toString() === req.user._id.toString()) {
            return false;
          }
          return true;
        });

        return !isTrialConflict;
      });

      if (availableOnAllDays) {
        availablePaidSeats.push(seat);
      }
    });

    availablePaidSeats.sort((a, b) => a.startTime.localeCompare(b.startTime));

    let scheduleData = null;
    if (schedule) {
      scheduleData = schedule.toObject ? schedule.toObject() : { ...schedule };
      let computedRates = [];
      for (const sub of scheduleData.subjects || []) {
        const calc = await calculateRateForSubject(sub.name, scheduleData.daysPerWeek, scheduleData.duration);
        computedRates.push({ subjectName: sub.name, calculatedRate: calc });
      }
      scheduleData.rates = computedRates;
    }

    return res.status(200).json({
      teacher: {
        _id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
        city: teacher.city,
        country: teacher.country,
        picture: teacher.picture,
        bio: teacher.bio,
        preferredLanguage: teacher.preferredLanguage,
        avgRating,
        totalReviews: reviews.length,
        totalClassesCompleted,
        lastActive,
      },
      schedule: scheduleData,
      reviews,
      existingBooking,
      activeBookings: studentActiveBookings,
      existingTrial,
      studentTrials,
      availableSeatsByDay,
      availablePaidSeats,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch teacher profile", error: error.message });
  }
}

module.exports = {
  getTeachers,
  getTeacherById,
  invalidatePublicTeachersCache,
};
