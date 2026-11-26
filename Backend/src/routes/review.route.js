const express = require("express");
const router = express.Router();

const reviewControllers = require("../controllers/review.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/", authMiddleware("student"), reviewControllers.createReview);

module.exports = router;
