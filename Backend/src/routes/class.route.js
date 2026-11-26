const express = require("express");
const router = express.Router();

const classControllers = require("../controllers/class.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Get single class with dynamic meet link and countdown
router.get(
  "/:id",
  authMiddleware("student", "teacher", "admin"),
  classControllers.getClassById,
);

// Teacher marks class session completed
router.put(
  "/:id/complete",
  authMiddleware("teacher", "admin"),
  classControllers.completeClass,
);

module.exports = router;
