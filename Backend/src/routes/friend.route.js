const express = require("express");
const router = express.Router();
const friendController = require("../controllers/friend.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.use(authMiddleware());

router.get("/suggestions", friendController.getSuggestions);
router.get("/search", friendController.searchPeople);
router.get("/requests", friendController.getFriendRequests);
router.post("/request/:targetUserId", friendController.sendFriendRequest);
router.put("/accept/:friendshipId", friendController.acceptFriendRequest);
router.put("/decline/:friendshipId", friendController.declineFriendRequest);

module.exports = router;
