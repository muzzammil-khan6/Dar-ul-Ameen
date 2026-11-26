const express = require("express");
const router = express.Router();

const paymentControllers = require("../controllers/payment.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/pay", authMiddleware("student"), paymentControllers.payForBooking);

module.exports = router;
