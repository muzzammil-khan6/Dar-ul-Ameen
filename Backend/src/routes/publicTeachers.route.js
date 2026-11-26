const express = require("express");
const router = express.Router();

const publicTeachersControllers = require("../controllers/publicTeachers.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/", authMiddleware.optional, publicTeachersControllers.getTeachers);
router.get("/:id", authMiddleware.optional, publicTeachersControllers.getTeacherById);

module.exports = router;
