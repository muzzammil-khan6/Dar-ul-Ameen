const authModel = require("../models/auth.model");
const Subject = require("../models/subject.model");
const Rate = require("../models/rate.model");
const Settings = require("../models/settings.model");
const Booking = require("../models/booking.model");
const Payment = require("../models/payment.model");
const Withdraw = require("../models/withdraw.model");
const Schedule = require("../models/schedule.model");
const Wallet = require("../models/wallet.model");
const Class = require("../models/class.model");
const Topup = require("../models/topup.model");
const { emitToUser, emitToAdmin, broadcastEvent } = require("../services/socket.service");
const { generateClasses, expireOverdueBookings } = require("./booking.controller");

// ==========================================
// 1. EXISTING 3 CONTROLLERS - KEPT AS THEY ARE
// ==========================================

/**
 * 1. Fetch Teacher Approvals - Get list of pending teachers
 * @route   GET /api/admin/requests
 */
async function requestsController(req, res) {
  try {
    const pendingTeachers = await authModel.find({
      role: "teacher",
      teachingStatus: "pending",
    });

    if (pendingTeachers.length === 0) {
      return res.status(200).json({
        message: "No pending teaching requests found",
        count: 0,
        requests: [],
      });
    }

    return res.status(200).json({
      message: "Pending teaching requests successfully fetched",
      count: pendingTeachers.length,
      requests: pendingTeachers,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch pending requests",
      error: error.message,
    });
  }
}

/**
 * 2. Accept Teacher - Approve teacher
 * @route   PATCH /api/admin/approve-teacher/:id
 * @route   PUT /api/admin/teachers/:id/approve
 */
async function approveTeacherController(req, res) {
  try {
    const teacherId = req.params.id;

    // Teacher check
    const teacher = await authModel.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher account not found" });
    }

    if (
      !teacher.role.includes("teacher") ||
      teacher.teachingStatus !== "pending"
    ) {
      return res
        .status(400)
        .json({ message: "This user does not have a pending teacher request" });
    }

    // Status approved
    teacher.teachingStatus = "approved";
    await teacher.save();

    // Also mark schedule as approved if exists
    await Schedule.findOneAndUpdate(
      { teacher: teacherId },
      { isApproved: true },
    );

    return res.status(200).json({
      message: `Teacher ${teacher.fullName} successfully approved.`,
      user: {
        id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
        role: "teacher",
        teachingStatus: teacher.teachingStatus,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Teacher approval failed",
      error: error.message,
    });
  }
}

/**
 * 3. Reject Teacher - Reject teacher
 * @route   PATCH /api/admin/reject-teacher/:id
 * @route   PUT /api/admin/teachers/:id/reject
 */
async function rejectTeacherController(req, res) {
  try {
    const teacherId = req.params.id;

    const teacher = await authModel.findById(teacherId);
    if (!teacher || !teacher.role.includes("teacher")) {
      return res.status(404).json({ message: "Teacher account not found" });
    }

    // update
    teacher.teachingStatus = "rejected";
    await teacher.save();

    // Also mark schedule as not approved
    await Schedule.findOneAndUpdate(
      { teacher: teacherId },
      { isApproved: false },
    );

    return res.status(200).json({
      message: `Teacher request for ${teacher.fullName} was rejected.`,
      user: {
        id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
        role: "teacher",
        teachingStatus: teacher.teachingStatus,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Rejection failed", error: error.message });
  }
}

// ==========================================
// ADDITIONAL ADMIN CONTROLLERS
// ==========================================

// Block / Unblock teacher
async function toggleBlockTeacherController(req, res) {
  try {
    const teacherId = req.params.id;
    const teacher = await authModel.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    teacher.isBlocked = !teacher.isBlocked;
    await teacher.save();

    return res.status(200).json({
      message: `Teacher ${teacher.fullName} has been ${
        teacher.isBlocked ? "blocked" : "unblocked"
      } successfully.`,
      teacher: {
        id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
        isBlocked: teacher.isBlocked,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Block/unblock failed", error: error.message });
  }
}

// GET /api/admin/teachers - Get all teachers
async function getAllTeachersController(req, res) {
  try {
    const teachers = await authModel
      .find({ role: "teacher" })
      .select("-password")
      .sort({ createdAt: -1 });

    const teacherIds = teachers.map((t) => t._id);
    const schedules = await Schedule.find({ teacher: { $in: teacherIds } });
    const scheduleMap = new Map();
    for (const s of schedules) {
      scheduleMap.set(s.teacher.toString(), s);
    }

    const enriched = teachers.map((t) => {
      const tObj = t.toObject();
      tObj.schedule = scheduleMap.get(t._id.toString()) || null;
      return tObj;
    });

    return res.status(200).json({ teachers: enriched });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch teachers", error: error.message });
  }
}

// GET /api/admin/dashboard - Get admin stats
async function getDashboardController(req, res) {
  try {
    const totalUsers = await authModel.countDocuments();
    const totalTeachers = await authModel.countDocuments({ role: "teacher" });
    const totalStudents = await authModel.countDocuments({ role: "student" });
    const totalBookings = await Booking.countDocuments({
      status: { $nin: ["cancelled", "canceled"] },
    });

    // Payments / Revenue
    const payments = await Payment.find({ status: "paid" });
    const totalRevenue = payments.reduce((acc, p) => acc + (p.totalPrice || 0), 0);
    const commissionEarned = payments.reduce(
      (acc, p) => acc + (p.commission || 0),
      0,
    );
    const teacherShareTotal = payments.reduce(
      (acc, p) => acc + (p.teacherShare || 0),
      0,
    );

    // Cancelled bookings must never be displayed in the Admin Portal
    const recentBookings = await Booking.find({
      status: { $nin: ["cancelled", "canceled"] },
    })
      .populate("student", "fullName email picture")
      .populate("teacher", "fullName email picture")
      .sort({ createdAt: -1 })
      .limit(6);

    const pendingApprovalsCount = await authModel.countDocuments({
      role: "teacher",
      teachingStatus: "pending",
    });

    return res.status(200).json({
      stats: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalBookings,
        totalRevenue,
        commissionEarned,
        teacherShareTotal,
        pendingApprovalsCount,
      },
      recentBookings,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load admin stats", error: error.message });
  }
}

// GET /api/admin/subjects
async function getSubjectsController(req, res) {
  try {
    const subjects = await Subject.find().sort({ name: 1 }).lean();
    const rates = await Rate.find().lean();
    const rateMapBySubId = new Map();
    const rateMapByName = new Map();
    rates.forEach((r) => {
      if (r.subject) rateMapBySubId.set(r.subject.toString(), r.weeklyFullRate);
      if (r.subjectName)
        rateMapByName.set(r.subjectName.toLowerCase(), r.weeklyFullRate);
    });

    const enrichedSubjects = subjects.map((sub) => {
      const rateVal =
        sub.weeklyFullRate ||
        rateMapBySubId.get(sub._id.toString()) ||
        rateMapByName.get(sub.name?.toLowerCase()) ||
        7000;
      const monthlyRateVal = sub.monthlyFullRate || rateVal * 4;
      return {
        ...sub,
        weeklyFullRate: rateVal,
        monthlyFullRate: monthlyRateVal,
      };
    });

    return res.status(200).json({ subjects: enrichedSubjects });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch subjects", error: error.message });
  }
}

// POST /api/admin/subjects
async function createSubjectController(req, res) {
  try {
    const { name, grades, weeklyFullRate, rate, monthlyFullRate } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Subject name is required" });
    }

    let rateNum = Number(weeklyFullRate ?? rate);
    let mRateNum = Number(monthlyFullRate);
    if ((!rateNum || isNaN(rateNum)) && mRateNum && !isNaN(mRateNum)) {
      rateNum = Math.round(mRateNum / 4);
    } else if (rateNum && (!mRateNum || isNaN(mRateNum))) {
      mRateNum = Math.round(rateNum * 4);
    }

    if (!rateNum || isNaN(rateNum) || rateNum <= 0) {
      return res.status(400).json({
        message: "Subject benchmark rate is required and must be greater than 0",
      });
    }

    const trimmedName = name.trim();
    const existing = await Subject.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });
    if (existing) {
      return res.status(400).json({ message: "Subject already exists" });
    }

    const gradesList = Array.isArray(grades)
      ? grades
      : typeof grades === "string"
      ? grades.split(",").map((g) => g.trim()).filter(Boolean)
      : ["Class 9", "Class 10", "Class 11", "Class 12", "O Level", "A Level"];

    const subject = await Subject.create({
      name: trimmedName,
      grades: gradesList,
      weeklyFullRate: rateNum,
      monthlyFullRate: mRateNum,
    });

    // Also automatically create/upsert the rate benchmark
    const rateDoc = await Rate.findOneAndUpdate(
      { subjectName: { $regex: new RegExp(`^${trimmedName}$`, "i") } },
      {
        subject: subject._id,
        subjectName: subject.name,
        weeklyFullRate: rateNum,
        monthlyFullRate: mRateNum,
      },
      { new: true, upsert: true },
    );

    return res.status(201).json({
      message: "Subject created successfully with rate",
      subject: {
        ...subject.toObject(),
        weeklyFullRate: rateNum,
        monthlyFullRate: mRateNum,
      },
      rate: rateDoc,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create subject", error: error.message });
  }
}

// PUT /api/admin/subjects/:id
async function updateSubjectController(req, res) {
  try {
    const { id } = req.params;
    const { name, grades, weeklyFullRate, rate, monthlyFullRate } = req.body;

    const subject = await Subject.findById(id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const oldName = subject.name;
    if (name && name.trim()) {
      const trimmedName = name.trim();
      const existing = await Subject.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
      });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Another subject with this name already exists" });
      }
      subject.name = trimmedName;
    }

    if (grades !== undefined) {
      subject.grades = Array.isArray(grades)
        ? grades
        : typeof grades === "string"
        ? grades.split(",").map((g) => g.trim()).filter(Boolean)
        : subject.grades;
    }

    let rateNum =
      weeklyFullRate !== undefined || rate !== undefined
        ? Number(weeklyFullRate ?? rate)
        : null;
    let mRateNum =
      monthlyFullRate !== undefined ? Number(monthlyFullRate) : null;

    if (rateNum === null && mRateNum !== null) {
      rateNum = Math.round(mRateNum / 4);
    } else if (rateNum !== null && mRateNum === null) {
      mRateNum = Math.round(rateNum * 4);
    }

    if (rateNum !== null) {
      if (isNaN(rateNum) || rateNum <= 0) {
        return res
          .status(400)
          .json({ message: "Subject rate must be greater than 0" });
      }
      subject.weeklyFullRate = rateNum;
      subject.monthlyFullRate = mRateNum;
    }

    await subject.save();

    // Update corresponding Rate doc
    if (rateNum !== null || subject.name !== oldName) {
      await Rate.findOneAndUpdate(
        {
          $or: [
            { subject: subject._id },
            { subjectName: { $regex: new RegExp(`^${oldName}$`, "i") } },
          ],
        },
        {
          subject: subject._id,
          subjectName: subject.name,
          ...(rateNum !== null
            ? { weeklyFullRate: rateNum, monthlyFullRate: mRateNum }
            : {}),
        },
        { new: true, upsert: true },
      );
    }

    return res.status(200).json({
      message: "Subject updated successfully",
      subject: {
        ...subject.toObject(),
        weeklyFullRate: subject.weeklyFullRate || rateNum,
        monthlyFullRate: subject.monthlyFullRate || mRateNum,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update subject", error: error.message });
  }
}

// DELETE /api/admin/subjects/:id
async function deleteSubjectController(req, res) {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    // Also remove associated rate by subject id or subjectName
    await Rate.deleteMany({
      $or: [
        { subject: subject._id },
        { subjectName: { $regex: new RegExp(`^${subject.name}$`, "i") } },
      ],
    });

    return res.status(200).json({ message: "Subject deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete subject", error: error.message });
  }
}

// GET /api/admin/rates
async function getRatesController(req, res) {
  try {
    const rates = await Rate.find().populate("subject").sort({ subjectName: 1 });
    return res.status(200).json({ rates });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch rates", error: error.message });
  }
}

// POST /api/admin/rates
async function createRateController(req, res) {
  try {
    const { subjectName, weeklyFullRate, subjectId } = req.body;

    if (!subjectName || !weeklyFullRate) {
      return res.status(400).json({
        message: "Subject name and weekly rate for 7 days/1 hour are required",
      });
    }

    const rateNum = Number(weeklyFullRate);
    if (rateNum <= 0) {
      return res.status(400).json({ message: "Rate must be greater than 0" });
    }

    let subjectDoc = null;
    if (subjectId) {
      subjectDoc = await Subject.findById(subjectId);
    } else {
      subjectDoc = await Subject.findOne({
        name: { $regex: new RegExp(`^${subjectName.trim()}$`, "i") },
      });
    }

    const rate = await Rate.findOneAndUpdate(
      { subjectName: { $regex: new RegExp(`^${subjectName.trim()}$`, "i") } },
      {
        subject: subjectDoc ? subjectDoc._id : null,
        subjectName: subjectDoc ? subjectDoc.name : subjectName.trim(),
        weeklyFullRate: rateNum,
      },
      { new: true, upsert: true },
    );

    if (subjectDoc) {
      subjectDoc.weeklyFullRate = rateNum;
      await subjectDoc.save();
    }

    return res.status(201).json({
      message: "Rate saved successfully",
      rate,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to create rate", error: error.message });
  }
}

// DELETE /api/admin/rates/:id
async function deleteRateController(req, res) {
  try {
    const rate = await Rate.findByIdAndDelete(req.params.id);
    if (!rate) {
      return res.status(404).json({ message: "Rate not found" });
    }
    return res.status(200).json({ message: "Rate deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete rate", error: error.message });
  }
}

// GET /api/admin/bookings
async function getBookingsController(req, res) {
  try {
    await expireOverdueBookings();
    const { status } = req.query;
    const query = {};
    if (status && status !== "All") {
      query.status = status;
    } else {
      // By default in Admin Portal, cancelled bookings are not displayed
      query.status = { $nin: ["cancelled", "canceled"] };
    }

    // Cancelled bookings must never be displayed in the Admin Portal
    if (query.status === "cancelled" || query.status === "canceled") {
      return res.status(200).json({ bookings: [] });
    }

    const bookings = await Booking.find(query)
      .populate("student", "fullName email picture phone city country")
      .populate("teacher", "fullName email picture phone city country")
      .sort({ createdAt: -1 });

    return res.status(200).json({ bookings });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
}

// PUT /api/admin/bookings/:id/approve-payment - Admin approves payment for booking
async function approveBookingPaymentController(req, res) {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "payment_done, waiting_for_admin") {
      return res.status(400).json({
        message: `Booking payment cannot be approved from '${booking.status}' status. Only bookings with status 'payment_done, waiting_for_admin' can be approved.`,
      });
    }

    booking.status = "active";
    booking.isPaid = true;
    booking.paidAt = new Date();
    booking.adminApprovedAt = new Date();
    await booking.save();

    // ONLY NOW create Paid Classes for ALL Days (Same Time Seat)
    const teacherSchedule = await Schedule.findOne({ teacher: booking.teacher });
    if (teacherSchedule) {
      const classRecords = generateClasses(
        booking,
        teacherSchedule,
        booking.startDate,
      );
      if (classRecords.length > 0) {
        await Class.insertMany(classRecords);
      }
    }

    // Update Student's wallet transaction if paid via wallet
    if (booking.paymentMethod === "wallet") {
      await Wallet.updateMany(
        {
          booking: booking._id,
          user: booking.student,
          type: "booking_payment",
          status: "pending_admin",
        },
        { $set: { status: "approved" } },
      );
    }

    // Create / ensure Payment record
    let payment = await Payment.findOne({ booking: booking._id });
    if (!payment) {
      payment = await Payment.create({
        booking: booking._id,
        student: booking.student,
        teacher: booking.teacher,
        totalPrice: booking.totalPrice,
        commission: booking.commission,
        teacherShare: booking.teacherShare,
        paymentMethod: booking.paymentMethod || "wallet",
        status: "paid",
      });
    } else {
      payment.status = "paid";
      await payment.save();
    }

    // Teacher gets money ONLY after class is completed, not after admin approval.
    // Show in teacher wallet as pending earnings until class completed:
    const existingTeacherEarning = await Wallet.findOne({
      booking: booking._id,
      user: booking.teacher,
      type: "earning",
    });
    if (!existingTeacherEarning) {
      await Wallet.create({
        user: booking.teacher,
        role: "teacher",
        booking: booking._id,
        type: "earning",
        amount: booking.teacherShare,
        status: "pending",
        description: `Pending earning for Booking #${booking._id} (${booking.subject}) - Unlocks upon class completion`,
      });
    }

    // Platform commission
    const adminUser = await authModel.findOne({ role: "admin" });
    if (adminUser) {
      const existingCommission = await Wallet.findOne({
        booking: booking._id,
        user: adminUser._id,
        type: "commission",
      });
      if (!existingCommission) {
        await Wallet.create({
          user: adminUser._id,
          role: "admin",
          booking: booking._id,
          type: "commission",
          amount: booking.commission,
          status: "completed",
          description: `Platform commission from Booking #${booking._id}`,
        });
      }
    }

    // Referral Reward for First Paid Booking:
    // If student was referred, inviter gets Rs. 100 wallet bonus upon completing first paid booking
    try {
      const studentUser = await authModel.findById(booking.student);
      if (studentUser && studentUser.referredBy) {
        const priorPaidCount = await Booking.countDocuments({
          student: studentUser._id,
          isPaid: true,
          _id: { $ne: booking._id },
        });

        if (priorPaidCount === 0) {
          // This is the student's FIRST paid booking!
          const inviter = await authModel.findById(studentUser.referredBy);
          if (inviter) {
            const inviteModel = require("../models/invite.model");
            let inviteRecord = await inviteModel.findOne({
              inviter: inviter._id,
              joinedUser: studentUser._id,
            });

            if (!inviteRecord || inviteRecord.status !== "rewarded") {
              if (inviteRecord) {
                inviteRecord.status = "rewarded";
                inviteRecord.rewardedAt = new Date();
                inviteRecord.rewardAmount = 100;
                await inviteRecord.save();
              } else {
                await inviteModel.create({
                  inviter: inviter._id,
                  invitedEmail: studentUser.email,
                  invitedName: studentUser.fullName,
                  status: "rewarded",
                  joinedUser: studentUser._id,
                  joinedAt: studentUser.createdAt || new Date(),
                  rewardedAt: new Date(),
                  rewardAmount: 100,
                });
              }

              // Credit Rs. 100 to inviter
              const inviterRole = inviter.role?.includes("teacher")
                ? "teacher"
                : "student";
              if (inviterRole === "student") {
                inviter.studentWallet = (inviter.studentWallet || 0) + 100;
                await inviter.save();
              }

              await Wallet.create({
                user: inviter._id,
                role: inviterRole,
                booking: booking._id,
                type: inviterRole === "teacher" ? "earning" : "topup",
                amount: 100,
                status: inviterRole === "teacher" ? "available" : "approved",
                description: `Referral reward bonus: Rs. 100 for inviting ${studentUser.fullName} (First paid booking)`,
              });

              // Notify inviter via Socket.io
              const { getIO } = require("../services/socket.service");
              const io = getIO();
              if (io) {
                io.to(`user_${inviter._id}`).emit("notification", {
                  type: "referral_reward",
                  title: "Reward Earned!",
                  message: `You earned Rs. 100 bonus because ${studentUser.fullName} completed their first booking!`,
                  amount: 100,
                });
              }
            }
          }
        }
      }
    } catch (rewardErr) {
      console.error(
        "Error processing referral reward on booking approval:",
        rewardErr,
      );
    }

    emitToUser(booking.student, "bookingUpdated", {
      booking,
      action: "payment_approved",
      status: "active",
      message: "Payment approved! Your classes are now active.",
    });
    emitToUser(booking.teacher, "bookingUpdated", {
      booking,
      action: "payment_approved",
      status: "active",
      message: "Payment approved! Classes are now active.",
    });
    emitToAdmin("bookingUpdated", {
      booking,
      action: "payment_approved",
      status: "active",
    });

    emitToUser(booking.student, "classUpdated", {
      bookingId: booking._id,
      action: "classes_created",
    });
    emitToUser(booking.teacher, "classUpdated", {
      bookingId: booking._id,
      action: "classes_created",
    });

    emitToUser(booking.student, "dashboardUpdated", { role: "student" });
    emitToUser(booking.teacher, "dashboardUpdated", { role: "teacher" });
    emitToAdmin("dashboardUpdated", { role: "admin" });

    return res.status(200).json({
      message: "Payment approved successfully. Classes are confirmed and live!",
      booking,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to approve booking payment",
      error: error.message,
    });
  }
}

// PUT /api/admin/bookings/:id/reject-payment - Admin rejects payment for booking
async function rejectBookingPaymentController(req, res) {
  try {
    const bookingId = req.params.id;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "payment_done, waiting_for_admin") {
      return res.status(400).json({
        message: `Booking payment cannot be rejected from '${booking.status}' status.`,
      });
    }

    booking.status = "payment_rejected";
    booking.adminRejectedAt = new Date();
    booking.rejectionReason = reason || "Payment rejected by admin";
    await booking.save();

    // If paid from Wallet, refund full amount to Student Wallet automatically
    if (booking.paymentMethod === "wallet") {
      const updatedStudent = await authModel.findByIdAndUpdate(
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
        description: `Automatic refund for rejected booking payment #${booking._id}`,
      });

      await Wallet.updateMany(
        {
          booking: booking._id,
          user: booking.student,
          type: "booking_payment",
        },
        { $set: { status: "rejected" } },
      );

      emitToUser(booking.student, "walletUpdated", {
        balance: updatedStudent?.studentWallet || 0,
        action: "refund",
        amount: booking.totalPrice,
      });
    }

    emitToUser(booking.student, "bookingUpdated", {
      booking,
      action: "payment_rejected",
      status: "payment_rejected",
      message: "Booking payment was rejected by admin.",
    });
    emitToUser(booking.teacher, "bookingUpdated", {
      booking,
      action: "payment_rejected",
      status: "payment_rejected",
      message: "Booking payment was rejected by admin.",
    });
    emitToAdmin("bookingUpdated", {
      booking,
      action: "payment_rejected",
    });

    emitToUser(booking.student, "dashboardUpdated", { role: "student" });
    emitToUser(booking.teacher, "dashboardUpdated", { role: "teacher" });
    emitToAdmin("dashboardUpdated", { role: "admin" });

    return res.status(200).json({
      message:
        "Payment rejected. Any wallet deductions have been refunded to the student.",
      booking,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to reject booking payment",
      error: error.message,
    });
  }
}

// GET /api/admin/payments
async function getPaymentsController(req, res) {
  try {
    const payments = await Payment.find()
      .populate("student", "fullName email")
      .populate("teacher", "fullName email")
      .populate("booking", "subject grade status")
      .sort({ createdAt: -1 });

    return res.status(200).json({ payments });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch payments", error: error.message });
  }
}

// GET /api/admin/withdraws
async function getWithdrawsController(req, res) {
  try {
    const withdraws = await Withdraw.find()
      .populate("teacher", "fullName email phone picture")
      .sort({ createdAt: -1 });

    return res.status(200).json({ withdraws });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch withdraws", error: error.message });
  }
}

// PUT /api/admin/withdraws/:id/approve
async function approveWithdrawController(req, res) {
  try {
    const withdraw = await Withdraw.findById(req.params.id);
    if (!withdraw) {
      return res.status(404).json({ message: "Withdraw request not found" });
    }

    if (withdraw.status !== "pending") {
      return res.status(400).json({
        message: `Withdraw is already ${withdraw.status}`,
      });
    }

    withdraw.status = "approved";
    withdraw.adminNote = req.body.adminNote || "Approved by admin";
    await withdraw.save();

    // Create wallet deduction entry
    await Wallet.create({
      user: withdraw.teacher,
      role: "teacher",
      type: "withdraw",
      amount: withdraw.amount,
      status: "completed",
      description: `Payout processed for withdrawal #${withdraw._id}`,
    });

    emitToUser(withdraw.teacher, "walletUpdated", {
      withdraw,
      action: "withdraw_approved",
      message: `Withdrawal request for PKR ${withdraw.amount} approved!`,
    });
    emitToAdmin("walletUpdated", {
      withdraw,
      action: "withdraw_approved",
    });

    return res.status(200).json({
      message: "Withdrawal request approved successfully",
      withdraw,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to approve withdraw", error: error.message });
  }
}

// PUT /api/admin/withdraws/:id/reject
async function rejectWithdrawController(req, res) {
  try {
    const withdraw = await Withdraw.findById(req.params.id);
    if (!withdraw) {
      return res.status(404).json({ message: "Withdraw request not found" });
    }

    if (withdraw.status !== "pending") {
      return res.status(400).json({
        message: `Withdraw is already ${withdraw.status}`,
      });
    }

    withdraw.status = "rejected";
    withdraw.adminNote = req.body.adminNote || "Rejected by admin";
    await withdraw.save();

    emitToUser(withdraw.teacher, "walletUpdated", {
      withdraw,
      action: "withdraw_rejected",
      message: `Withdrawal request for PKR ${withdraw.amount} was rejected.`,
    });
    emitToAdmin("walletUpdated", {
      withdraw,
      action: "withdraw_rejected",
    });

    return res.status(200).json({
      message: "Withdrawal request rejected",
      withdraw,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to reject withdraw", error: error.message });
  }
}

// GET /api/admin/settings
async function getSettingsController(req, res) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        commissionPercentage: 20,
        platformName: "Dar-ul-Ameen Tutor Booking Platform",
        minWithdrawal: 500,
      });
    }
    return res.status(200).json({ settings });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch settings", error: error.message });
  }
}

// PUT /api/admin/settings/commission
async function updateCommissionController(req, res) {
  try {
    const {
      commissionPercentage,
      platformName,
      minWithdrawal,
      jazzcashNumber,
      jazzcashTitle,
      easypaisaNumber,
      easypaisaTitle,
      bankName,
      bankAccountNumber,
      bankAccountTitle,
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (commissionPercentage !== undefined) {
      const commNum = Number(commissionPercentage);
      if (!isNaN(commNum) && commNum >= 0 && commNum <= 100) {
        settings.commissionPercentage = commNum;
      }
    }
    if (platformName) settings.platformName = platformName;
    if (minWithdrawal) settings.minWithdrawal = Number(minWithdrawal);
    if (jazzcashNumber !== undefined) settings.jazzcashNumber = jazzcashNumber;
    if (jazzcashTitle !== undefined) settings.jazzcashTitle = jazzcashTitle;
    if (easypaisaNumber !== undefined) settings.easypaisaNumber = easypaisaNumber;
    if (easypaisaTitle !== undefined) settings.easypaisaTitle = easypaisaTitle;
    if (bankName !== undefined) settings.bankName = bankName;
    if (bankAccountNumber !== undefined) settings.bankAccountNumber = bankAccountNumber;
    if (bankAccountTitle !== undefined) settings.bankAccountTitle = bankAccountTitle;

    await settings.save();

    return res.status(200).json({
      message: "Platform settings updated successfully",
      settings,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update settings", error: error.message });
  }
}

// GET /api/admin/wallet-requests - Admin views student wallet topup requests
async function getWalletRequestsController(req, res) {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== "All") {
      query.status = status;
    }
    const requests = await Topup.find(query)
      .populate("student", "fullName email picture phone city country")
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch wallet topup requests",
      error: error.message,
    });
  }
}

// PUT /api/admin/wallet-requests/:id/approve - Admin approves wallet topup
async function approveWalletRequestController(req, res) {
  try {
    const topup = await Topup.findById(req.params.id);
    if (!topup) {
      return res.status(404).json({ message: "Topup request not found" });
    }

    if (topup.status !== "pending_admin") {
      return res.status(400).json({
        message: `Topup request is already ${topup.status}`,
      });
    }

    topup.status = "approved";
    topup.adminNote = req.body.adminNote || "Approved by admin";
    await topup.save();

    // Add amount to Student Wallet
    const updatedStudent = await authModel.findByIdAndUpdate(
      topup.student,
      { $inc: { studentWallet: topup.amount } },
      { new: true },
    );

    // Create Wallet record
    await Wallet.create({
      user: topup.student,
      role: "student",
      type: "topup",
      amount: topup.amount,
      status: "approved",
      description: `Wallet Top-up approved via ${topup.paymentMethod} (Txn: ${topup.transactionId})`,
    });

    emitToUser(topup.student, "walletUpdated", {
      balance: updatedStudent?.studentWallet || 0,
      action: "topup_approved",
      amount: topup.amount,
      message: `Top-up of PKR ${topup.amount} approved!`,
    });
    emitToAdmin("walletUpdated", {
      topup,
      action: "topup_approved",
    });

    return res.status(200).json({
      message: "Wallet topup approved and credited to student wallet.",
      topup,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to approve topup request",
      error: error.message,
    });
  }
}

// PUT /api/admin/wallet-requests/:id/reject - Admin rejects wallet topup
async function rejectWalletRequestController(req, res) {
  try {
    const topup = await Topup.findById(req.params.id);
    if (!topup) {
      return res.status(404).json({ message: "Topup request not found" });
    }

    if (topup.status !== "pending_admin") {
      return res.status(400).json({
        message: `Topup request is already ${topup.status}`,
      });
    }

    topup.status = "rejected";
    topup.adminNote = req.body.adminNote || "Rejected by admin";
    await topup.save();

    emitToUser(topup.student, "walletUpdated", {
      topup,
      action: "topup_rejected",
      message: `Top-up of PKR ${topup.amount} was rejected by admin.`,
    });
    emitToAdmin("walletUpdated", {
      topup,
      action: "topup_rejected",
    });

    return res.status(200).json({
      message: "Wallet topup request rejected.",
      topup,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to reject topup request",
      error: error.message,
    });
  }
}

module.exports = {
  // 3 Original Controllers
  requestsController,
  approveTeacherController,
  rejectTeacherController,

  // Additional Admin Controllers
  toggleBlockTeacherController,
  getAllTeachersController,
  getDashboardController,
  getSubjectsController,
  createSubjectController,
  updateSubjectController,
  deleteSubjectController,
  getRatesController,
  createRateController,
  deleteRateController,
  getBookingsController,
  approveBookingPaymentController,
  rejectBookingPaymentController,
  getPaymentsController,
  getWithdrawsController,
  approveWithdrawController,
  rejectWithdrawController,
  getSettingsController,
  updateCommissionController,
  getWalletRequestsController,
  approveWalletRequestController,
  rejectWalletRequestController,
};
