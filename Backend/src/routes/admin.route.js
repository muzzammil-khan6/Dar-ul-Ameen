const express = require("express");
const router = express.Router();

//Local Modules
const adminControllers = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// ==========================================
// EXISTING ADMIN ROUTES (Kept as they are)
// ==========================================
router.get(
  "/requests",
  authMiddleware("admin"),
  adminControllers.requestsController,
);
router.patch(
  "/approve-teacher/:id",
  authMiddleware("admin"),
  adminControllers.approveTeacherController,
);
router.patch(
  "/reject-teacher/:id",
  authMiddleware("admin"),
  adminControllers.rejectTeacherController,
);

// ==========================================
// RESTFUL ADMIN ROUTES (Per Section 8)
// ==========================================

// Dashboard stats
router.get(
  "/dashboard",
  authMiddleware("admin"),
  adminControllers.getDashboardController,
);

// Teachers management
router.get(
  "/teachers",
  authMiddleware("admin"),
  adminControllers.getAllTeachersController,
);
router.put(
  "/teachers/:id/approve",
  authMiddleware("admin"),
  adminControllers.approveTeacherController,
);
router.put(
  "/teachers/:id/reject",
  authMiddleware("admin"),
  adminControllers.rejectTeacherController,
);
router.put(
  "/teachers/:id/block",
  authMiddleware("admin"),
  adminControllers.toggleBlockTeacherController,
);

// Subjects (GET is public/accessible by Teachers and Students; POST, PUT & DELETE are admin-only)
router.get(
  "/subjects",
  adminControllers.getSubjectsController,
);
router.post(
  "/subjects",
  authMiddleware("admin"),
  adminControllers.createSubjectController,
);
router.put(
  "/subjects/:id",
  authMiddleware("admin"),
  adminControllers.updateSubjectController,
);
router.delete(
  "/subjects/:id",
  authMiddleware("admin"),
  adminControllers.deleteSubjectController,
);

// Rates (GET is accessible by Teachers to calculate rates; POST & DELETE are admin-only)
router.get(
  "/rates",
  adminControllers.getRatesController,
);
router.post(
  "/rates",
  authMiddleware("admin"),
  adminControllers.createRateController,
);
router.delete(
  "/rates/:id",
  authMiddleware("admin"),
  adminControllers.deleteRateController,
);

// Bookings
router.get(
  "/bookings",
  authMiddleware("admin"),
  adminControllers.getBookingsController,
);
router.put(
  "/bookings/:id/approve-payment",
  authMiddleware("admin"),
  adminControllers.approveBookingPaymentController,
);
router.put(
  "/bookings/:id/reject-payment",
  authMiddleware("admin"),
  adminControllers.rejectBookingPaymentController,
);

// Wallet Topup Requests
router.get(
  "/wallet-requests",
  authMiddleware("admin"),
  adminControllers.getWalletRequestsController,
);
router.put(
  "/wallet-requests/:id/approve",
  authMiddleware("admin"),
  adminControllers.approveWalletRequestController,
);
router.put(
  "/wallet-requests/:id/reject",
  authMiddleware("admin"),
  adminControllers.rejectWalletRequestController,
);

// Payments
router.get(
  "/payments",
  authMiddleware("admin"),
  adminControllers.getPaymentsController,
);

// Withdrawals
router.get(
  "/withdraws",
  authMiddleware("admin"),
  adminControllers.getWithdrawsController,
);
router.put(
  "/withdraws/:id/approve",
  authMiddleware("admin"),
  adminControllers.approveWithdrawController,
);
router.put(
  "/withdraws/:id/reject",
  authMiddleware("admin"),
  adminControllers.rejectWithdrawController,
);

// Settings
router.get(
  "/settings",
  authMiddleware("admin"),
  adminControllers.getSettingsController,
);
router.put(
  "/settings/commission",
  authMiddleware("admin"),
  adminControllers.updateCommissionController,
);

module.exports = router;
