const express = require("express");
const router = express.Router();

const trialController = require("../controllers/trial.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Student creates trial request
router.post(
  "/",
  authMiddleware("student"),
  trialController.createTrial,
);

// Student fetches their trials
router.get(
  "/student",
  authMiddleware("student"),
  trialController.getStudentTrials,
);

// Teacher fetches trial requests
router.get(
  "/teacher",
  authMiddleware("teacher"),
  trialController.getTeacherTrials,
);

// Single trial details with live countdown & meet link
router.get(
  "/:id",
  authMiddleware("student", "teacher", "admin"),
  trialController.getTrialById,
);

// Teacher accepts trial
router.put(
  "/:id/accept",
  authMiddleware("teacher"),
  trialController.acceptTrial,
);

// Teacher rejects trial
router.put(
  "/:id/reject",
  authMiddleware("teacher"),
  trialController.rejectTrial,
);

// Student or Teacher cancels trial
router.put(
  "/:id/cancel",
  authMiddleware("student", "teacher"),
  trialController.cancelTrial,
);

// Teacher completes trial
router.put(
  "/:id/complete",
  authMiddleware("teacher"),
  trialController.completeTrial,
);

module.exports = router;
