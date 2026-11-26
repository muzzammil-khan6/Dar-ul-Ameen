const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// All chat routes require authentication
router.use(authMiddleware());

router.get("/list", chatController.getChatList);
router.get("/:userId/messages", chatController.getMessages);
router.post("/send", chatController.sendMessage);
router.put("/:userId/seen", chatController.markSeen);
router.post("/:userId/block", chatController.blockUser);
router.post("/:userId/unblock", chatController.unblockUser);
router.post("/:userId/mute", chatController.muteUser);
router.post("/:userId/unmute", chatController.unmuteUser);

module.exports = router;
