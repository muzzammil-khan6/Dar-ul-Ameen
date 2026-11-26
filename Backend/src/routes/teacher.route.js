const express = require("express");
const router = express.Router();

const teacherControllers = require("../controllers/teacher.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const teacherApprovalMiddleware = require("../middlewares/teacherGuard.middleware");

// Routes that DO NOT apply teacherApprovalMiddleware (as requested in Section 3):
// Schedule View, Schedule Edit, Profile, Pending-Approval, and all /auth/* APIs.
router.get(
  "/schedule",
  authMiddleware("teacher"),
  teacherControllers.getSchedule,
);
router.put(
  "/schedule",
  authMiddleware("teacher"),
  teacherControllers.updateSchedule,
);
router.post(
  "/schedule/card",
  authMiddleware("teacher"),
  teacherControllers.addOrUpdateSubjectCard,
);
router.delete(
  "/schedule/card/:subjectName",
  authMiddleware("teacher"),
  teacherControllers.deleteSubjectCard,
);
router.put(
  "/schedule/days",
  authMiddleware("teacher"),
  teacherControllers.updateDays,
);
router.post(
  "/schedule/slot",
  authMiddleware("teacher"),
  teacherControllers.addSlot,
);
router.delete(
  "/schedule/slot/:id",
  authMiddleware("teacher"),
  teacherControllers.deleteSlot,
);

// Routes that DO apply teacherApprovalMiddleware:
// Dashboard, Bookings, Wallet, Reviews
router.get(
  "/dashboard",
  authMiddleware("teacher"),
  teacherApprovalMiddleware,
  teacherControllers.getDashboard,
);
router.get(
  "/bookings",
  authMiddleware("teacher"),
  teacherApprovalMiddleware,
  teacherControllers.getBookings,
);
router.get(
  "/wallet",
  authMiddleware("teacher"),
  teacherApprovalMiddleware,
  teacherControllers.getWallet,
);
router.post(
  "/wallet/withdraw",
  authMiddleware("teacher"),
  teacherApprovalMiddleware,
  teacherControllers.requestWithdraw,
);
router.get(
  "/reviews",
  authMiddleware("teacher"),
  teacherApprovalMiddleware,
  teacherControllers.getReviews,
);

module.exports = router;
