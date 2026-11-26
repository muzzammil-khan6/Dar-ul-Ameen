const express = require("express");
const router = express.Router();

const studentControllers = require("../controllers/student.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get(
  "/dashboard",
  authMiddleware("student"),
  studentControllers.getDashboard,
);
router.get(
  "/bookings",
  authMiddleware("student"),
  studentControllers.getBookings,
);
router.get(
  "/bookings/:id",
  authMiddleware("student", "teacher", "admin"),
  studentControllers.getBookingDetail,
);

// Student Wallet endpoints
router.get(
  "/wallet",
  authMiddleware("student"),
  studentControllers.getStudentWallet,
);
router.post(
  "/wallet/topup",
  authMiddleware("student"),
  studentControllers.requestWalletTopup,
);
router.get(
  "/payment-settings",
  authMiddleware("student", "teacher", "admin"),
  studentControllers.getPaymentSettings,
);

module.exports = router;
