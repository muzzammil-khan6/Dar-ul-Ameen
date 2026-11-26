const express = require("express");
const router = express.Router();

const bookingControllers = require("../controllers/booking.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Student creates booking
router.post(
  "/",
  authMiddleware("student"),
  bookingControllers.createBooking,
);

// Teacher accepts booking
router.put(
  "/:id/accept",
  authMiddleware("teacher"),
  bookingControllers.acceptBooking,
);

// Teacher rejects booking
router.put(
  "/:id/reject",
  authMiddleware("teacher"),
  bookingControllers.rejectBooking,
);

// Cancel booking (student or teacher)
router.put(
  "/:id/cancel",
  authMiddleware("student", "teacher", "admin"),
  bookingControllers.cancelBooking,
);

// Send chat message
router.post(
  "/:id/chat",
  authMiddleware("student", "teacher", "admin"),
  bookingControllers.sendChat,
);

module.exports = router;
