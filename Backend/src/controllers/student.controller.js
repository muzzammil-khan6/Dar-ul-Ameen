const Booking = require("../models/booking.model");
const Class = require("../models/class.model");
const Chat = require("../models/chat.model");
const Trial = require("../models/trial.model");
const Auth = require("../models/auth.model");
const Topup = require("../models/topup.model");
const Wallet = require("../models/wallet.model");
const Settings = require("../models/settings.model");
const { emitToUser, emitToAdmin } = require("../services/socket.service");
const { expireOverdueBookings } = require("./booking.controller");

// GET /api/student/dashboard
async function getDashboard(req, res) {
  try {
    const studentId = req.user._id;
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    await expireOverdueBookings();

    // 1. Upcoming Classes rule:
    // a) Trial Classes where Trial Status = accepted AND date >= today
    const trialClasses = await Trial.find({
      student: studentId,
      status: "accepted",
      date: { $gte: today },
    })
      .populate("teacher", "fullName picture email")
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
      teacher: t.teacher,
      status: t.status,
    }));

    // b) Paid Classes where Booking Status = active (Payment Done & Admin Approved) AND Class Status = scheduled AND Class Date >= today
    const activeBookings = await Booking.find({
      student: studentId,
      status: "active",
    }).select("_id subject grade");

    const activeBookingIds = activeBookings.map((b) => b._id);

    const paidClasses = await Class.find({
      student: studentId,
      booking: { $in: activeBookingIds },
      status: "scheduled",
      date: { $gte: today },
    })
      .populate("teacher", "fullName picture email")
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
      teacher: c.teacher,
      status: c.status,
    }));

    // Combine and sort chronologically by date and startTime
    const allUpcoming = [...formattedTrials, ...formattedPaid].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.startTime.localeCompare(b.startTime);
    });

    const upcomingClasses = allUpcoming.slice(0, 5);

    // Total spent (active + completed bookings)
    const paidBookings = await Booking.find({
      student: studentId,
      status: { $in: ["active", "completed"] },
    });
    const totalSpent = paidBookings.reduce(
      (acc, curr) => acc + (curr.totalPrice || 0),
      0,
    );

    // Fetch all bookings for student
    const allBookings = await Booking.find({ student: studentId })
      .populate("teacher", "fullName picture email")
      .sort({ createdAt: -1 });

    // Exclude cancelled bookings from dashboard stats and recent bookings
    const activeDashboardBookings = allBookings.filter((b) => {
      const isCancelled =
        b.status?.toLowerCase() === "cancelled" ||
        b.status?.toLowerCase() === "canceled";
      return !isCancelled;
    });

    const recentBookings = activeDashboardBookings.slice(0, 5);
    const totalBookings = activeDashboardBookings.length;

    return res.status(200).json({
      stats: {
        totalBookings,
        totalSpent,
        upcomingClassesCount: upcomingClasses.length,
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

// GET /api/student/bookings
async function getBookings(req, res) {
  try {
    const studentId = req.user._id;
    const { status, page, limit } = req.query;

    await expireOverdueBookings();

    const allBookings = await Booking.find({ student: studentId })
      .populate("teacher", "fullName email picture city country")
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    // Deduplicate: only one instance of a booking (the latest update) per teacher time slot
    const seenBookingSlots = new Set();
    const latestBookings = [];

    for (const b of allBookings) {
      const teacherId = (b.teacher?._id || b.teacher)?.toString();
      const startTime = b.timeSlot?.startTime || "";
      const endTime = b.timeSlot?.endTime || "";
      const slotKey = `${teacherId}_${startTime}_${endTime}`;
      if (!seenBookingSlots.has(slotKey)) {
        seenBookingSlots.add(slotKey);
        latestBookings.push(b);
      }
    }

    const filtered = latestBookings.filter((b) => {
      const isCancelled =
        b.status?.toLowerCase() === "cancelled" ||
        b.status?.toLowerCase() === "canceled";

      if (status && status !== "All") {
        const queryStatus = status.toLowerCase();
        if (queryStatus === "cancelled" || queryStatus === "canceled") {
          return isCancelled;
        }
        return b.status?.toLowerCase() === queryStatus;
      }

      // Default ("All"): Do not include cancelled bookings so they do not appear when not filtering by Cancelled
      return !isCancelled;
    });

    const bookingIds = filtered.map((b) => b._id);
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

    const enriched = filtered.map((b) => {
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

// GET /api/student/bookings/:id
async function getBookingDetail(req, res) {
  try {
    const userId = req.user._id.toString();
    const bookingId = req.params.id;

    await expireOverdueBookings();

    const booking = await Booking.findById(bookingId)
      .populate(
        "teacher",
        "fullName email picture phone city country teachingStatus",
      )
      .populate("student", "fullName email picture phone city country");

    if (!booking) {
      // Check if this ID is a Trial
      const trial = await Trial.findById(bookingId)
        .populate(
          "teacher",
          "fullName email picture phone city country teachingStatus",
        )
        .populate("student", "fullName email picture phone city country");

      if (trial) {
        const isStudentTrial = trial.student?._id?.toString() === userId;
        const isTeacherTrial = trial.teacher?._id?.toString() === userId;
        const isAdminTrial = req.user.role.includes("admin");

        if (!isStudentTrial && !isTeacherTrial && !isAdminTrial) {
          return res
            .status(403)
            .json({ message: "Access denied to this trial" });
        }

        const trialObj = trial.toObject();
        trialObj.isTrial = true;
        trialObj.type = "trial";
        trialObj.totalPrice = 0;
        trialObj.daysPerWeek = 1;
        trialObj.startDate = trial.date;
        trialObj.classes = [
          {
            _id: trial._id,
            date: trial.date,
            day: trial.day,
            startTime: trial.startTime,
            endTime: trial.endTime,
            duration: trial.duration,
            status: trial.status === "completed" ? "completed" : "scheduled",
          },
        ];
        trialObj.chat = [];

        return res.status(200).json({ booking: trialObj });
      }

      return res.status(404).json({ message: "Booking not found" });
    }

    // Security check: Only the student or teacher of this booking (or admin) can view
    const isStudent = booking.student._id.toString() === userId;
    const isTeacher = booking.teacher._id.toString() === userId;
    const isAdmin = req.user.role.includes("admin");

    if (!isStudent && !isTeacher && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied to this booking" });
    }

    const classes = await Class.find({ booking: bookingId }).sort({
      date: 1,
      startTime: 1,
    });

    const chatMessages = await Chat.find({ booking: bookingId })
      .populate("sender", "fullName picture")
      .sort({ createdAt: 1 });

    const bookingObj = booking.toObject();

    // VISIBILITY RULE for Student:
    // "Student sees ONLY Total Price. Example: '1500 / week'. He never sees commission breakdown."
    if (isStudent && !isAdmin) {
      delete bookingObj.commission;
      delete bookingObj.teacherShare;
    }

    bookingObj.classes = classes;
    bookingObj.chat = chatMessages;

    return res.status(200).json({ booking: bookingObj });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch booking details",
      error: error.message,
    });
  }
}

// GET /api/student/wallet - Fetch student wallet balance and history
async function getStudentWallet(req, res) {
  try {
    const studentId = req.user._id;
    const student = await Auth.findById(studentId);

    const transactions = await Wallet.find({
      user: studentId,
      role: "student",
    }).sort({ createdAt: -1 });

    const topups = await Topup.find({ student: studentId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      balance: student?.studentWallet || 0,
      transactions,
      topups,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch wallet information",
      error: error.message,
    });
  }
}

// POST /api/student/wallet/topup - Student submits topup request
async function requestWalletTopup(req, res) {
  try {
    const studentId = req.user._id;
    const { amount, paymentMethod = "JazzCash", transactionId, screenshot } =
      req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Please provide a valid topup amount greater than 0" });
    }

    if (!transactionId || !transactionId.trim()) {
      return res.status(400).json({ message: "Transaction ID is required" });
    }

    if (!screenshot) {
      return res
        .status(400)
        .json({ message: "Screenshot proof of transaction is required" });
    }

    const topup = await Topup.create({
      student: studentId,
      amount: numAmount,
      paymentMethod,
      transactionId: transactionId.trim(),
      screenshot,
      status: "pending_admin",
    });

    emitToAdmin("walletUpdated", {
      topup,
      action: "topup_requested",
      message: `New Wallet Top-Up Request received for PKR ${numAmount}`,
    });
    emitToUser(studentId, "walletUpdated", {
      topup,
      action: "topup_requested",
      message: "Top-up request submitted.",
    });

    return res.status(201).json({
      message:
        "Wallet top-up request submitted successfully. Waiting for admin approval.",
      topup,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to submit topup request",
      error: error.message,
    });
  }
}

// GET /api/student/payment-settings - Return platform payment settings (JazzCash, Easypaisa, Bank)
async function getPaymentSettings(req, res) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    return res.status(200).json({
      jazzcashNumber: settings.jazzcashNumber || "03001234567",
      jazzcashTitle: settings.jazzcashTitle || "Dar-ul-Ameen Official",
      easypaisaNumber: settings.easypaisaNumber || "03451234567",
      easypaisaTitle: settings.easypaisaTitle || "Dar-ul-Ameen Official",
      bankName: settings.bankName || "Meezan Bank",
      bankAccountNumber: settings.bankAccountNumber || "01020304050607",
      bankAccountTitle: settings.bankAccountTitle || "Dar-ul-Ameen",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch payment settings",
      error: error.message,
    });
  }
}

module.exports = {
  getDashboard,
  getBookings,
  getBookingDetail,
  getStudentWallet,
  requestWalletTopup,
  getPaymentSettings,
};
