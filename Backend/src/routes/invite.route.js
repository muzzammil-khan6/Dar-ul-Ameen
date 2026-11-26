const express = require("express");
const router = express.Router();
const inviteController = require("../controllers/invite.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Public referral validation
router.get("/ref/:refCode", inviteController.validateReferral);

// Protected invite routes
router.use(authMiddleware());

router.get("/", inviteController.getInviteSummary);
router.post("/email", inviteController.sendEmailInvite);
router.post("/phone", inviteController.createPhoneInvite);

module.exports = router;
